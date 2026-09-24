import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./AddListingPage.css";


export default function AddListingPage() {
  const navigate = useNavigate();

  const [category, setCategory] = useState("STAY");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("per night");
  const [amenities, setAmenities] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [proofDocument, setProofDocument] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("Business proof");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      navigate("/provider/login");
      return;
    }

    if (!name || !address || !price) {
      setMessage("Please fill the required listing details.");
      return;
    }

    if ((latitude && !longitude) || (!latitude && longitude)) {
      setMessage("Enter both latitude and longitude, or leave both blank.");
      return;
    }

    setSubmitting(true);

    const amenityList = amenities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const { data: createdListing, error: listingError } = await supabase
      .from("listings")
      .insert({
        provider_id: user.id,
        category,
        name,
        description,
        address,
        contact_phone: phone || null,
        price: Number(price),
        price_unit: priceUnit,
        amenities: amenityList,
        opening_hours: openingHours || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        coordinate_source:
          latitude && longitude ? "Provider entered coordinates" : null,
      })
      .select("id")
      .single();

    if (listingError || !createdListing) {
      setMessage(listingError?.message || "Could not create the listing.");
      setSubmitting(false);
      return;
    }

    const listingId = createdListing.id;

    for (const photo of photos) {
      const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${listingId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, photo);

      if (uploadError) {
        setMessage(`Listing saved, but a photo failed: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }

      const { error: imageError } = await supabase.from("listing_images").insert({
        listing_id: listingId,
        storage_path: path,
        alt_text: name,
      });

      if (imageError) {
        setMessage(`Listing saved, but photo data failed: ${imageError.message}`);
        setSubmitting(false);
        return;
      }
    }

    if (proofDocument) {
      const safeName = proofDocument.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${listingId}/${crypto.randomUUID()}-${safeName}`;

      const { error: documentUploadError } = await supabase.storage
        .from("provider-documents")
        .upload(path, proofDocument);

      if (documentUploadError) {
        setMessage(
          `Listing saved, but document upload failed: ${documentUploadError.message}`
        );
        setSubmitting(false);
        return;
      }

      const { error: documentError } = await supabase
        .from("verification_documents")
        .insert({
          provider_id: user.id,
          document_type: documentType,
          storage_path: path,
        });

      if (documentError) {
        setMessage(
          `Listing saved, but document data failed: ${documentError.message}`
        );
        setSubmitting(false);
        return;
      }
    }

    const { error: reviewError } = await supabase
      .from("listings")
      .update({ status: "pending_review" })
      .eq("id", listingId);

    if (reviewError) {
      setMessage(`Listing saved as draft: ${reviewError.message}`);
      setSubmitting(false);
      return;
    }

    navigate("/provider");
  }

  return (
    <main className="add-listing-page">
      <Link to="/provider" className="add-listing-back">
        ← Back to dashboard
      </Link>

      <section className="add-listing-card">
        <p className="add-listing-label">PROVIDER PORTAL</p>
        <h1>Add your service</h1>
        <span>Complete details help travellers find your Bhopal service.</span>

        <form onSubmit={submitListing}>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="STAY">Stay / Hotel / Hostel</option>
              <option value="FOOD">Restaurant / Food</option>
              <option value="PLACE">Tourist Place</option>
              <option value="TRAVEL">Travel / Transport</option>
            </select>
          </label>

          <label>
            Listing name *
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Lake View Hotel"
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell travellers what makes your service special."
              rows={4}
            />
          </label>

          <label>
            Full address / locality *
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Example: Shamla Hills, Bhopal"
            />
          </label>

          <label>
            Contact phone
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Example: 9876543210"
            />
          </label>

          <div className="add-listing-two-columns">
            <label>
              Price (₹) *
              <input
                required
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1500"
              />
            </label>

            <label>
              Price unit
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
              >
                <option value="per night">Per night</option>
                <option value="per person">Per person</option>
                <option value="per entry">Per entry</option>
                <option value="starting price">Starting price</option>
              </select>
            </label>
          </div>

          <label>
            Amenities (separate with commas)
            <input
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              placeholder="Wi-Fi, Parking, Breakfast, AC"
            />
          </label>

          <label>
            Opening hours
            <input
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="Example: 9:00 AM – 10:00 PM"
            />
          </label>

          <div className="add-listing-two-columns">
            <label>
              Latitude
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="23.2599"
              />
            </label>

            <label>
              Longitude
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="77.4126"
              />
            </label>
          </div>

          <label>
            Listing photos
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files || []))}
            />
          </label>

          <label>
            Proof document type
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option>Business proof</option>
              <option>Identity proof</option>
              <option>Address proof</option>
              <option>Tourism registration</option>
            </select>
          </label>

          <label>
            Private proof document
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setProofDocument(e.target.files?.[0] || null)}
            />
          </label>

          {message && <p className="add-listing-message">{message}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for review →"}
          </button>
        </form>
      </section>
    </main>
  );
}