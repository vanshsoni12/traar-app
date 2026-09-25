import { normalizeProviderTariff } from "../utils/pricing";
import ProviderLocationFields from "../components/ProviderLocationFields";
import { formatListingAddress, parseListingAddress } from "../utils/listingLocation";
import { classificationFields } from "../utils/listingClassification";
import { coordinatesFrom } from "../utils/staySearch";
import Modal from "../components/Modal";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./ProviderDashboardPage.css";

type ListingImage = {
  id: string;
  storage_path: string;
  sort_order: number;
};

type Listing = {
  id: string;
  category: string;
  stay_type?: string | null;
  food_type?: string | null;
  place_type?: string | null;
  travel_type?: string | null;
  diet?: string | null;
  coordinate_source?: string | null;
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
  listing_images: ListingImage[];
};

type EditForm = {
  state: string;
  city: string;
  listingType: string;
  diet: string;
  name: string;
  description: string;
  address: string;
  contactPhone: string;
  price: string;
  priceUnit: string;
  amenities: string;
  openingHours: string;
  latitude: string;
  longitude: string;
};

export default function ProviderDashboardPage() {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("all");
  const [preview, setPreview] = useState<Listing | null>(null);
  const [providerId, setProviderId] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  const [form, setForm] = useState<EditForm>({
    state: "",
    city: "",
    listingType: "",
    diet: "",
    name: "",
    description: "",
    address: "",
    contactPhone: "",
    price: "",
    priceUnit: "",
    amenities: "",
    openingHours: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    loadListings();
  }, []);

  async function loadListings() {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      navigate("/provider/login");
      return;
    }

    setProviderId(authData.user.id);
    const { data, error } = await supabase
      .from("listings")
      .select(
        "*, listing_images(id, storage_path, sort_order)"
      )
      .eq("provider_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setListings(((data || []) as Listing[]).map(normalizeProviderTariff));
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  function getImageUrl(path?: string) {
    if (!path) return "";

    return supabase.storage.from("listing-images").getPublicUrl(path).data
      .publicUrl;
  }

  function openEditor(listing: Listing) {
    setMessage("");
    setSelectedPhotos([]);
    setEditingListing(listing);

    const savedLocation = parseListingAddress(listing.address || "");
    setForm({
      state: savedLocation.state,
      city: savedLocation.city,
      listingType: (listing.category === 'STAY' ? listing.stay_type : listing.category === 'FOOD' ? listing.food_type : listing.category === 'PLACE' ? listing.place_type : listing.travel_type) || "",
      diet: listing.diet || "",
      name: listing.name || "",
      description: listing.description || "",
      address: savedLocation.address,
      contactPhone: listing.contact_phone || "",
      price: listing.price === null ? "" : String(listing.price),
      priceUnit: listing.price_unit || "",
      amenities: listing.amenities?.join(", ") || "",
      openingHours: listing.opening_hours || "",
      latitude: listing.latitude === null ? "" : String(listing.latitude),
      longitude: listing.longitude === null ? "" : String(listing.longitude),
    });
  }

  function closeEditor() {
    if (saving) return;

    setEditingListing(null);
    setSelectedPhotos([]);
  }

  function updateForm(field: keyof EditForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function choosePhotos(files: FileList | null) {
    if (!files) return;

    const images = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    setSelectedPhotos(images);
  }

  async function uploadSelectedPhotos(
    listingId: string,
    providerId: string,
    currentPhotoCount: number
  ) {
    for (const [index, file] of selectedPhotos.entries()) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");

      const storagePath = `${providerId}/${listingId}/${Date.now()}-${index}-${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(storagePath, file);

      if (uploadError) {
        throw new Error(`Photo upload failed: ${uploadError.message}`);
      }

      const { error: imageRecordError } = await supabase
        .from("listing_images")
        .insert({
          listing_id: listingId,
          storage_path: storagePath,
          sort_order: currentPhotoCount + index,
        });

      if (imageRecordError) {
        throw new Error(`Photo record failed: ${imageRecordError.message}`);
      }
    }
  }

  async function saveListing(resubmitForReview: boolean) {
    if (!editingListing) return;

    if (!form.name.trim() || !form.address.trim() || !form.state || !form.city.trim()) {
      setMessage("Listing name, state, city/destination and street address are required.");
      return;
    }

    if ((form.latitude || form.longitude) && !coordinatesFrom(form.latitude, form.longitude)) {
      setMessage("Enter valid latitude and longitude, or leave both blank.");
      return;
    }
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      navigate("/provider/login");
      return;
    }

    setSaving(true);
    setMessage("");

    const cleanAmenities = form.amenities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const classification = classificationFields(editingListing.category, form.listingType, form.diet);
    const updateData = {
      ...Object.fromEntries(Object.entries(classification).filter(([key, value]) => value !== null || key in editingListing)),
      coordinate_source: form.latitude && form.longitude
        ? (Number(form.latitude) === editingListing.latitude && Number(form.longitude) === editingListing.longitude
          ? editingListing.coordinate_source || "Provider entered coordinates" : "Provider entered coordinates") : null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      address: formatListingAddress(form.address, form.city, form.state),
      contact_phone: form.contactPhone.trim() || null,
      price: form.price ? Number(form.price) : null,
      price_unit: form.priceUnit.trim() || null,
      amenities: cleanAmenities,
      opening_hours: form.openingHours.trim() || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      status: resubmitForReview
        ? "pending_review"
        : editingListing.status,
      rejection_reason: resubmitForReview
        ? null
        : editingListing.rejection_reason,
    };

    const { error } = await supabase
      .from("listings")
      .update(updateData)
      .eq("id", editingListing.id)
      .eq("provider_id", authData.user.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    try {
      if (selectedPhotos.length > 0) {
        await uploadSelectedPhotos(
          editingListing.id,
          authData.user.id,
          editingListing.listing_images.length
        );
      }
    } catch (photoError) {
      setSaving(false);
      setMessage(
        photoError instanceof Error
          ? `Details saved, but ${photoError.message}`
          : "Details saved, but photo upload failed."
      );
      return;
    }

    setSaving(false);
    setEditingListing(null);
    setSelectedPhotos([]);

    await loadListings();

    setMessage(
      resubmitForReview
        ? "Listing and photos updated. Submitted for admin review."
        : "Listing details and photos updated successfully."
    );
  }

  async function removePhoto(image: ListingImage) {
    if (!editingListing) return;

    const shouldRemove = window.confirm("Remove this listing photo?");

    if (!shouldRemove) return;

    setSaving(true);

    const { error: storageError } = await supabase.storage
      .from("listing-images")
      .remove([image.storage_path]);

    if (storageError) {
      setSaving(false);
      setMessage(storageError.message);
      return;
    }

    const { error: databaseError } = await supabase
      .from("listing_images")
      .delete()
      .eq("id", image.id);

    if (databaseError) {
      setSaving(false);
      setMessage(databaseError.message);
      return;
    }

    const updatedImages = editingListing.listing_images.filter(
      (item) => item.id !== image.id
    );

    const updatedListing = {
      ...editingListing,
      listing_images: updatedImages,
    };

    setEditingListing(updatedListing);

    setListings((current) =>
      current.map((listing) =>
        listing.id === editingListing.id ? updatedListing : listing
      )
    );

    setSaving(false);
    setMessage("Photo removed successfully.");
  }

  async function withdrawListing(listing: Listing) {
    const shouldWithdraw = window.confirm(
      `Withdraw "${listing.name}"? It will no longer be visible to travellers.`
    );

    if (!shouldWithdraw) return;

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      navigate("/provider/login");
      return;
    }

    const { error } = await supabase
      .from("listings")
      .update({ status: "draft" })
      .eq("id", listing.id)
      .eq("provider_id", authData.user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setListings((current) =>
      current.map((item) =>
        item.id === listing.id ? { ...item, status: "draft" } : item
      )
    );

    setMessage(`${listing.name} was withdrawn and saved as a draft.`);
  }

  const approvedCount = listings.filter(
    (listing) => listing.status === "approved"
  ).length;

  const pendingCount = listings.filter(
    (listing) => listing.status === "pending_review"
  ).length;

  const rejectedCount = listings.filter(
    (listing) => listing.status === "rejected"
  ).length;

  return (
    <main className="provider-dashboard-page">
      {providerId && <p className="ex-tag">Active Provider: {providerId}</p>}
      <header className="provider-nav">
        <div className="provider-logo">
          <img src={`${import.meta.env.BASE_URL}PHOTO-2026-09-25-02-23-39.jpg`} alt="TRAAR" style={{ width: "150px", height: "auto", display: "block" }} />
        </div>

        <div className="provider-nav-actions">
          <button onClick={loadListings} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="provider-hero">
        <div>
          <p>PROVIDER DASHBOARD</p>
          <h1>Manage your travel listings</h1>
          <span>
            Edit listing details, update photos and respond to admin feedback.
          </span>
        </div>

        <div className="provider-hero-actions">
          <Link to="/provider/services/new" className="provider-add-button">
            + Add new listing
          </Link>

          <Link to="/provider/documents" className="provider-add-button">
            Manage documents
          </Link>
        </div>
      </section>

      <section className="provider-stat-grid">
        <article>
          <p>Total listings</p>
          <strong>{listings.length}</strong>
        </article>

        <article>
          <p>Live &amp; approved</p>
          <strong>{approvedCount}</strong>
        </article>

        <article>
          <p>Pending review</p>
          <strong>{pendingCount}</strong>
        </article>

        <article>
          <p>Needs changes</p>
          <strong>{rejectedCount}</strong>
        </article>
      </section>

      <div className="ex-toggle-row">{[["all", `All Listings (${listings.length})`], ["approved", `Approved (${approvedCount})`], ["pending_review", `Pending Review (${pendingCount})`], ["rejected", `Rejected (${rejectedCount})`]].map(([value, label]) => <button key={value} aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)}>{label}</button>)}</div>
      <p className="ex-muted">Monthly views: analytics are not connected.</p>
      <section className="provider-listings">
        <div className="provider-listing-heading">
          <div>
            <p>YOUR SERVICES</p>
            <h2>Your listings</h2>
          </div>
        </div>

        {loading && <p>Loading your listings...</p>}
        {message && <p className="provider-error">{message}</p>}

        {!loading && listings.length === 0 && (
          <div className="provider-empty">
            <div>📋</div>
            <h3>No listings yet</h3>
            <p>Add your hotel, restaurant, place or travel service.</p>
          </div>
        )}

        <div className="provider-listings-grid">
          {listings.filter((listing) => statusFilter === "all" || listing.status === statusFilter).map((listing) => {
            const firstImage = [...(listing.listing_images || [])].sort(
              (a, b) => a.sort_order - b.sort_order
            )[0];

            return (
              <article className="provider-listing-card" key={listing.id}>
                {firstImage ? (
                  <img
                    className="provider-listing-image"
                    src={getImageUrl(firstImage.storage_path)}
                    alt={listing.name}
                  />
                ) : (
                  <div className="provider-listing-image provider-image-empty">
                    📷
                  </div>
                )}

                <p>{listing.category}</p>
                <h3>{listing.name}</h3>
                <span>📍 {listing.address}</span>

                {listing.price !== null && (
                  <strong>
                    ₹{Number(listing.price).toLocaleString("en-IN")}{" "}
                    {listing.price_unit}
                  </strong>
                )}

                <small className={`provider-status ${listing.status}`}>
                  {listing.status.replace("_", " ")}
                </small>

                {listing.status === "rejected" && (
                  <p className="provider-rejection-message">
                    <b>Admin feedback:</b>{" "}
                    {listing.rejection_reason || "Please update this listing."}
                  </p>
                )}

                <div className="provider-card-actions">
                  <button onClick={() => setPreview(listing)}>◉ Preview</button>
                  <button onClick={() => openEditor(listing)}>
                    Edit listing
                  </button>

                  {listing.status !== "draft" && (
                    <button
                      className="provider-withdraw-button"
                      onClick={() => withdrawListing(listing)}
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {preview && <Modal title={preview.name} onClose={() => setPreview(null)}><div className="ex-modal-content"><p className="ex-tag">{preview.category} · {preview.status.replaceAll("_", " ")}</p><h2>{preview.name}</h2><p>⌖ {preview.address}</p><p>{preview.description || "No description supplied."}</p><h3>{preview.price === null ? "Price on request" : `₹${preview.price} ${preview.price_unit || ""}`}</h3><p>{preview.amenities?.join(" • ")}</p>{preview.listing_images.map((image) => <img key={image.id} src={getImageUrl(image.storage_path)} alt={preview.name} style={{ width: "100%", borderRadius: 10, marginTop: 12 }} />)}</div></Modal>}
      {editingListing && (
        <div className="provider-modal-backdrop" onClick={closeEditor}>
          <section
            className="provider-edit-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="provider-modal-close"
              onClick={closeEditor}
              disabled={saving}
            >
              ×
            </button>

            <p>EDIT LISTING</p>
            <h2>{editingListing.name}</h2>

            <label>
              Listing name
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
              />
            </label>

            <label>
              Description
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
              />
            </label>

            <ProviderLocationFields state={form.state} city={form.city} onStateChange={(value) => updateForm("state", value)} onCityChange={(value) => updateForm("city", value)} />
            <label>
              Street address / locality
              <input
                value={form.address}
                onChange={(event) => updateForm("address", event.target.value)}
              />
            </label>

            <label>
              Contact phone
              <input
                value={form.contactPhone}
                onChange={(event) =>
                  updateForm("contactPhone", event.target.value)
                }
              />
            </label>

            <div className="provider-edit-two-columns">
              <label>
                Price (₹)
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) => updateForm("price", event.target.value)}
                />
              </label>

              <label>
                Price unit
                <input
                  placeholder="per night / per person"
                  value={form.priceUnit}
                  onChange={(event) =>
                    updateForm("priceUnit", event.target.value)
                  }
                />
              </label>
            </div>

            <label>
              Amenities (separate with commas)
              <input
                value={form.amenities}
                onChange={(event) =>
                  updateForm("amenities", event.target.value)
                }
              />
            </label>

            <label>
              Opening hours
              <input
                value={form.openingHours}
                onChange={(event) =>
                  updateForm("openingHours", event.target.value)
                }
              />
            </label>

            <div className="provider-edit-two-columns">
              <label>
                Latitude
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(event) =>
                    updateForm("latitude", event.target.value)
                  }
                />
              </label>

              <label>
                Longitude
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(event) =>
                    updateForm("longitude", event.target.value)
                  }
                />
              </label>
            </div>

            <label>
              Add new listing photos
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => choosePhotos(event.target.files)}
              />
            </label>

            {selectedPhotos.length > 0 && (
              <p className="provider-photo-count">
                {selectedPhotos.length} new photo(s) ready to upload.
              </p>
            )}

            <h3>Current listing photos</h3>

            <div className="provider-current-photos">
              {editingListing.listing_images.length === 0 ? (
                <p>No photos uploaded yet.</p>
              ) : (
                editingListing.listing_images
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((image) => (
                    <div key={image.id} className="provider-photo-item">
                      <img
                        src={getImageUrl(image.storage_path)}
                        alt="Listing"
                      />

                      <button
                        type="button"
                        onClick={() => removePhoto(image)}
                        disabled={saving}
                      >
                        Remove photo
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="provider-edit-actions">
              <button onClick={() => saveListing(false)} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>

              {editingListing.status === "rejected" && (
                <button
                  className="provider-resubmit-button"
                  onClick={() => saveListing(true)}
                  disabled={saving}
                >
                  {saving ? "Submitting..." : "Save & resubmit for review"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
