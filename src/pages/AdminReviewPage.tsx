import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./AdminReviewPage.css";

type Tab = "pending" | "reports" | "directory" | "rules";

type ListingImage = {
  storage_path: string;
  sort_order: number;
};

type Listing = {
  id: string;
  provider_id: string;
  category: string;
  name: string;
  description: string | null;
  address: string;
  contact_phone: string | null;
  price: number | null;
  price_unit: string | null;
  amenities: string[] | null;
  opening_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  listing_images: ListingImage[];
};

type Profile = {
  id: string;
  full_name: string | null;
};

type ProofDocument = {
  id: string;
  provider_id: string;
  document_type: string;
  storage_path: string;
};

type UserReport = {
  id: string;
  listing_id: string | null;
  report_type: string;
  message: string;
  status: string;
  created_at: string;
};

type ListingAudit = {
  id: string;
  listing_id: string;
  audit_type: string;
  outcome: string;
  notes: string | null;
  created_at: string;
};

export default function AdminReviewPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("pending");
  const [listings, setListings] = useState<Listing[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [documents, setDocuments] = useState<ProofDocument[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [audits, setAudits] = useState<ListingAudit[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      navigate("/admin/login");
      return;
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (myProfile?.role !== "admin") {
      navigate("/");
      return;
    }

    const [listingResult, profileResult, documentResult, reportResult] =
      await Promise.all([
        supabase
          .from("listings")
          .select(
            "id, provider_id, category, name, description, address, contact_phone, price, price_unit, amenities, opening_hours, latitude, longitude, status, rejection_reason, created_at, listing_images(storage_path, sort_order)"
          )
          .order("created_at", { ascending: false }),

        supabase.from("profiles").select("id, full_name"),

        supabase
          .from("verification_documents")
          .select("id, provider_id, document_type, storage_path"),

        supabase
          .from("user_reports")
          .select("id, listing_id, report_type, message, status, created_at")
          .order("created_at", { ascending: false }),
      ]);

    if (listingResult.error) {
      setMessage(listingResult.error.message);
    } else {
      setListings((listingResult.data || []) as Listing[]);
    }

    if (profileResult.error) {
      setMessage(profileResult.error.message);
    } else {
      setProfiles((profileResult.data || []) as Profile[]);
    }

    if (documentResult.error) {
      setMessage(documentResult.error.message);
    } else {
      setDocuments((documentResult.data || []) as ProofDocument[]);
    }

    if (reportResult.error) {
      setMessage(reportResult.error.message);
    } else {
      setReports((reportResult.data || []) as UserReport[]);
    }

    setLoading(false);
  }

  function providerName(providerId: string) {
    return (
      profiles.find((profile) => profile.id === providerId)?.full_name ||
      "Provider"
    );
  }

  function providerDocuments(providerId: string) {
    return documents.filter((document) => document.provider_id === providerId);
  }

  function listingImage(listing: Listing) {
    const firstImage = [...(listing.listing_images || [])].sort(
      (a, b) => a.sort_order - b.sort_order
    )[0];

    if (!firstImage) return "";

    return supabase.storage
      .from("listing-images")
      .getPublicUrl(firstImage.storage_path).data.publicUrl;
  }

  async function openDocument(path: string) {
    const { data, error } = await supabase.storage
      .from("provider-documents")
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      setMessage(error?.message || "Could not open this document.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function openListing(listing: Listing) {
    setSelectedListing(listing);

    const { data, error } = await supabase
      .from("listing_audits")
      .select("id, listing_id, audit_type, outcome, notes, created_at")
      .eq("listing_id", listing.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setAudits((data || []) as ListingAudit[]);
  }

  async function updateListingStatus(
    listing: Listing,
    newStatus: "approved" | "rejected"
  ) {
    if (newStatus === "rejected" && !rejectionReason.trim()) {
      setMessage("Enter a rejection reason before rejecting this listing.");
      return;
    }

    const { error } = await supabase
      .from("listings")
      .update({
        status: newStatus,
        rejection_reason:
          newStatus === "rejected" ? rejectionReason.trim() : null,
      })
      .eq("id", listing.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();

    if (authData.user) {
      const { error: auditError } = await supabase
        .from("listing_audits")
        .insert({
          listing_id: listing.id,
          admin_id: authData.user.id,
          audit_type: "Admin decision",
          outcome: newStatus === "approved" ? "Approved" : "Rejected",
          notes:
            newStatus === "approved"
              ? "Listing approved by an administrator."
              : rejectionReason.trim(),
          coordinate_checked: false,
          tariff_checked: false,
        });

      if (auditError) {
        setMessage(`Listing updated, but audit log failed: ${auditError.message}`);
      }
    }

    setListings((current) =>
      current.map((item) =>
        item.id === listing.id
          ? {
            ...item,
            status: newStatus,
            rejection_reason:
              newStatus === "rejected" ? rejectionReason.trim() : null,
          }
          : item
      )
    );

    setSelectedListing(null);
    setRejectionReason("");

    if (newStatus === "approved") {
      setMessage(`${listing.name} is now approved and visible to travellers.`);
    } else {
      setMessage(`${listing.name} was rejected.`);
    }
  }

  async function runAudit(listing: Listing) {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const validCoordinates =
      listing.latitude !== null &&
      listing.longitude !== null &&
      listing.latitude >= -90 &&
      listing.latitude <= 90 &&
      listing.longitude >= -180 &&
      listing.longitude <= 180;

    const validTariff =
      listing.price !== null &&
      listing.price >= 0 &&
      Boolean(listing.price_unit);

    const hasPhoto = (listing.listing_images || []).length > 0;
    const hasProof = providerDocuments(listing.provider_id).length > 0;

    const passed =
      validCoordinates &&
      validTariff &&
      Boolean(listing.address) &&
      Boolean(listing.contact_phone) &&
      hasPhoto &&
      hasProof;

    const notes = [
      validCoordinates ? "Coordinates valid" : "Coordinates need review",
      validTariff ? "Tariff present" : "Tariff missing",
      hasPhoto ? "Photo attached" : "No listing photo",
      hasProof ? "Proof attached" : "No proof document",
    ].join(" • ");

    const { error } = await supabase.from("listing_audits").insert({
      listing_id: listing.id,
      admin_id: authData.user.id,
      audit_type: "Automated completeness audit",
      outcome: passed ? "Passed" : "Needs review",
      notes,
      coordinate_checked: validCoordinates,
      tariff_checked: validTariff,
    });

    setMessage(
      error
        ? error.message
        : `${passed ? "Audit passed" : "Audit needs review"}: ${notes}`
    );
  }

  async function resolveReport(
    report: UserReport,
    status: "resolved" | "dismissed"
  ) {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { error } = await supabase
      .from("user_reports")
      .update({
        status,
        resolved_by: authData.user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setReports((current) =>
      current.map((item) =>
        item.id === report.id ? { ...item, status } : item
      )
    );

    setMessage(`Report marked as ${status}.`);
  }

  const pendingListings = listings.filter(
    (listing) => listing.status === "pending_review"
  );

  const approvedListings = listings.filter(
    (listing) => listing.status === "approved"
  );

  const openReports = reports.filter((report) => report.status === "open");

  const qualityScore = useMemo(() => {
    if (listings.length === 0) return 0;

    const completeListings = listings.filter((listing) => {
      return Boolean(
        listing.description &&
        listing.contact_phone &&
        listing.price !== null &&
        listing.latitude !== null &&
        listing.longitude !== null &&
        (listing.listing_images || []).length > 0 &&
        providerDocuments(listing.provider_id).length > 0
      );
    });

    return Math.round((completeListings.length / listings.length) * 100);
  }, [listings, documents]);

  const visibleListings = listings.filter((listing) => {
    const matchesSearch = `${listing.name} ${listing.address} ${listing.category}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const categoryMatches =
      categoryFilter === "ALL" || listing.category === categoryFilter;

    const statusMatches =
      statusFilter === "ALL" || listing.status === statusFilter;

    return matchesSearch && categoryMatches && statusMatches;
  });
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <main className="admin-page">
      <header className="admin-nav">
        <Link to="/" className="admin-logo">
          TRAAR<span>.</span>
        </Link>

        <div className="admin-nav-actions">
          <Link to="/provider" className="admin-provider-link">
            Provider dashboard
          </Link>
          <button
            className="admin-provider-link"
            onClick={loadAdminData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh data"}
          </button>

          
          <button
            className="admin-provider-link"
            onClick={handleLogout}
          >
            Logout
          </button>
          <span className="admin-badge">Admin clearance active</span>
        </div>
      </header>

      <section className="admin-hero">
        <div>
          <p>ADMINISTRATION PORTAL</p>
          <h1>Administration &amp; Data Quality Desk</h1>
          <span>
            Review provider filings, moderate listings, resolve reports and
            maintain reliable travel information.
          </span>
        </div>
      </section>

      <section className="admin-stat-grid">
        <article>
          <p>Pending moderation</p>
          <strong>{pendingListings.length}</strong>
          <span>Awaiting verification audit</span>
        </article>

        <article>
          <p>User reports &amp; feedback</p>
          <strong className="admin-red">{openReports.length}</strong>
          <span>Open user corrections</span>
        </article>

        <article>
          <p>Approved services</p>
          <strong className="admin-green">{approvedListings.length}</strong>
          <span>Active on public portal</span>
        </article>

        <article>
          <p>Data quality score</p>
          <strong className="admin-green">{qualityScore}%</strong>
          <span>Based on complete listing data</span>
        </article>
      </section>

      <nav className="admin-tabs">
        <button
          className={tab === "pending" ? "active" : ""}
          onClick={() => setTab("pending")}
        >
          Pending review queue ({pendingListings.length})
        </button>

        <button
          className={tab === "reports" ? "active" : ""}
          onClick={() => setTab("reports")}
        >
          User reports &amp; feedback ({openReports.length})
        </button>

        <button
          className={tab === "directory" ? "active" : ""}
          onClick={() => setTab("directory")}
        >
          All listings directory ({listings.length})
        </button>

        <button
          className={tab === "rules" ? "active" : ""}
          onClick={() => setTab("rules")}
        >
          Data integrity &amp; audit rules
        </button>
      </nav>

      {message && <p className="admin-message">{message}</p>}
      {loading && <p className="admin-loading">Loading administration data...</p>}

      {!loading && tab === "pending" && (
        <section className="admin-content">
          {pendingListings.length === 0 ? (
            <div className="admin-empty">
              <h2>No listings are waiting for review.</h2>
              <p>New provider submissions will appear here.</p>
            </div>
          ) : (
            pendingListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                imageUrl={listingImage(listing)}
                providerName={providerName(listing.provider_id)}
                documents={providerDocuments(listing.provider_id)}
                onInspect={() => openListing(listing)}
                onAudit={() => runAudit(listing)}
              />
            ))
          )}
        </section>
      )}

      {!loading && tab === "directory" && (
        <section className="admin-content">
          <div className="admin-filters">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search listings"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="ALL">All categories</option>
              <option value="STAY">Stays</option>
              <option value="FOOD">Food</option>
              <option value="PLACE">Places</option>
              <option value="TRAVEL">Travel</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {visibleListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              imageUrl={listingImage(listing)}
              providerName={providerName(listing.provider_id)}
              documents={providerDocuments(listing.provider_id)}
              onInspect={() => openListing(listing)}
              onAudit={() => runAudit(listing)}
            />
          ))}
        </section>
      )}

      {!loading && tab === "reports" && (
        <section className="admin-content">
          {reports.length === 0 ? (
            <div className="admin-empty">
              <h2>No user reports yet.</h2>
              <p>User feedback and corrections will appear here.</p>
            </div>
          ) : (
            reports.map((report) => {
              const listing = listings.find(
                (item) => item.id === report.listing_id
              );

              return (
                <article className="admin-report-card" key={report.id}>
                  <div>
                    <p>{report.report_type}</p>
                    <h2>{listing?.name || "General platform report"}</h2>
                    <span>{report.message}</span>
                    <small>
                      Status: <b>{report.status}</b>
                    </small>
                  </div>

                  {report.status === "open" && (
                    <div className="admin-report-actions">
                      <button
                        className="admin-dismiss-button"
                        onClick={() => resolveReport(report, "dismissed")}
                      >
                        Dismiss
                      </button>

                      <button
                        className="admin-approve-button"
                        onClick={() => resolveReport(report, "resolved")}
                      >
                        Mark resolved
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      )}

      {!loading && tab === "rules" && (
        <section className="admin-rules">
          <h2>Transparent automated audit checks</h2>
          <p>
            These are internal quality checks. They do not claim to verify a
            government registry or live GPS provider.
          </p>

          <div className="admin-rules-grid">
            <article>
              <h3>Coordinates</h3>
              <p>Latitude must be -90 to 90 and longitude -180 to 180.</p>
            </article>

            <article>
              <h3>Tariff details</h3>
              <p>A non-negative price and price unit are needed.</p>
            </article>

            <article>
              <h3>Traveller clarity</h3>
              <p>Address, phone number, photo and description should exist.</p>
            </article>

            <article>
              <h3>Provider verification</h3>
              <p>Admins inspect the private proof documents before approval.</p>
            </article>
          </div>
        </section>
      )}

      {selectedListing && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedListing(null)}
        >
          <section
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="admin-modal-close"
              onClick={() => setSelectedListing(null)}
            >
              ×
            </button>

            <p>{selectedListing.category}</p>
            <h2>{selectedListing.name}</h2>
            <span>
              {selectedListing.description || "No description provided."}
            </span>

            <div className="admin-inspect-data">
              <p>
                <b>Provider:</b> {providerName(selectedListing.provider_id)}
              </p>
              <p>
                <b>Address:</b> {selectedListing.address}
              </p>
              <p>
                <b>Phone:</b> {selectedListing.contact_phone || "Not provided"}
              </p>
              <p>
                <b>Tariff:</b> ₹{selectedListing.price ?? "Not provided"}{" "}
                {selectedListing.price_unit || ""}
              </p>
              <p>
                <b>Coordinates:</b> {selectedListing.latitude ?? "—"},{" "}
                {selectedListing.longitude ?? "—"}
              </p>
              <p>
                <b>Amenities:</b>{" "}
                {selectedListing.amenities?.join(", ") || "Not provided"}
              </p>
            </div>

            <h3>Private verification documents</h3>

            <div className="admin-document-list">
              {providerDocuments(selectedListing.provider_id).length === 0 ? (
                <span>No proof document uploaded.</span>
              ) : (
                providerDocuments(selectedListing.provider_id).map(
                  (document) => (
                    <button
                      key={document.id}
                      onClick={() => openDocument(document.storage_path)}
                    >
                      View {document.document_type}
                    </button>
                  )
                )
              )}
            </div>

            <h3>Audit history</h3>

            <div className="admin-document-list">
              {audits.length === 0 ? (
                <span>No audit has been run for this listing yet.</span>
              ) : (
                audits.map((audit) => (
                  <div key={audit.id}>
                    <b>{audit.audit_type}</b> — {audit.outcome}
                    <br />
                    <small>{audit.notes || "No notes"}</small>
                  </div>
                ))
              )}
            </div>

            {selectedListing.status === "pending_review" && (
              <>
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Rejection reason — required only if rejecting"
                  rows={3}
                />

                <div className="admin-modal-actions">
                  <button
                    className="admin-reject-button"
                    onClick={() =>
                      updateListingStatus(selectedListing, "rejected")
                    }
                  >
                    Reject
                  </button>

                  <button
                    className="admin-approve-button"
                    onClick={() =>
                      updateListingStatus(selectedListing, "approved")
                    }
                  >
                    Approve listing
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function ListingCard({
  listing,
  imageUrl,
  providerName,
  documents,
  onInspect,
  onAudit,
}: {
  listing: Listing;
  imageUrl: string;
  providerName: string;
  documents: ProofDocument[];
  onInspect: () => void;
  onAudit: () => void;
}) {

  return (
    <article className="admin-listing-card">
      {imageUrl ? (
        <img src={imageUrl} alt={listing.name} />
      ) : (
        <div className="admin-no-image">📷</div>
      )}

      <div className="admin-listing-info">
        <div className="admin-listing-title">
          <h2>{listing.name}</h2>
          <span>{listing.category}</span>
        </div>

        <p>{listing.address}</p>

        <small>
          Provider: {providerName} • ID: {listing.id.slice(0, 8)}
        </small>

        <small>
          Tariff: ₹{listing.price ?? "—"} {listing.price_unit || ""} • GPS:{" "}
          {listing.latitude ?? "—"}, {listing.longitude ?? "—"}
        </small>

        <small>Proof documents: {documents.length}</small>
      </div>

      <div className="admin-listing-actions">
        <button className="admin-audit-button" onClick={onAudit}>
          Run quality audit
        </button>

        <button className="admin-inspect-button" onClick={onInspect}>
          Inspect
        </button>

        <span className={`admin-status ${listing.status}`}>
          {listing.status.replace("_", " ")}
        </span>
      </div>
    </article>
  );
}