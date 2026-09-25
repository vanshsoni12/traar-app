import ProviderLocationFields from "../components/ProviderLocationFields";
import { formatListingAddress } from "../utils/listingLocation";
import { cityCentre } from "../context/ExplorerContext";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./AddListingPage.css";


export default function AddListingPage() {
  const navigate = useNavigate();

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [importingPhoto, setImportingPhoto] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [coordinateSource, setCoordinateSource] = useState("Provider entered coordinates");
  const [category, setCategory] = useState("STAY");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [listingState, setListingState] = useState("Madhya Pradesh");
  const [listingCity, setListingCity] = useState("Bhopal");
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

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setProviderId(data.user?.id || "")); }, []);
  useEffect(() => { const urls = photos.map((photo) => URL.createObjectURL(photo)); setPhotoPreviews(urls); return () => urls.forEach((url) => URL.revokeObjectURL(url)); }, [photos]);
  async function importPhoto() {
    setMessage("");
    try {
      const url = new URL(photoUrl);
      if (url.protocol !== "https:") throw new Error("Use an HTTPS image URL.");
      setImportingPhoto(true);
      const response = await fetch(url.href);
      if (!response.ok) throw new Error("The image could not be downloaded.");
      const blob = await response.blob();
      if (!["image/jpeg", "image/png", "image/webp"].includes(blob.type) || blob.size > 10 * 1024 * 1024) throw new Error("Use a PNG, JPEG or WebP image smaller than 10 MB.");
      setPhotos((current) => [...current, new File([blob], `linked-photo-${Date.now()}.${blob.type.split("/")[1]}`, { type: blob.type })]); setPhotoUrl("");
    } catch (error) { setMessage(error instanceof Error ? error.message + " You can also upload the image from your device." : "Image unavailable. Upload from your device instead."); } finally { setImportingPhoto(false); }
  }
  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      navigate("/provider/login");
      return;
    }

    if (!name.trim() || !address.trim() || !price || !listingState || !listingCity.trim()) {
      setMessage("Please fill the required listing details.");
      return;
    }

    if ((latitude && !longitude) || (!latitude && longitude)) {
      setMessage("Enter both latitude and longitude, or leave both blank.");
      return;
    }

    if ((latitude && (Number(latitude) < -90 || Number(latitude) > 90)) || (longitude && (Number(longitude) < -180 || Number(longitude) > 180))) { setMessage("Coordinates are outside the valid range."); return; }
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
        address: formatListingAddress(address, listingCity, listingState),
        contact_phone: phone || null,
        price: Number(price),
        price_unit: priceUnit,
        amenities: amenityList,
        opening_hours: openingHours || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        coordinate_source:
          latitude && longitude ? (coordinateSource.includes("reference only") &&
            Number(latitude) === cityCentre.coordinates!.latitude && Number(longitude) === cityCentre.coordinates!.longitude
            ? coordinateSource : "Provider entered coordinates") : null,
      })
      .select("id")
      .single();

    if (listingError || !createdListing) {
      setMessage(listingError?.message || "Could not create the listing.");
      setSubmitting(false);
      return;
    }

    const listingId = createdListing.id;

    for (const [photoIndex, photo] of photos.entries()) {
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
        sort_order: photoIndex,
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

      <section className="add-listing-card">
        <p className="add-listing-label">PROVIDER VERIFICATION ONBOARDING DESK</p>
        <p className="ex-tag">ID: {providerId || "Sign in to submit"}</p>
        <button type="button" className="ex-sample-button" onClick={() => { setName("Sample service — replace before submitting"); setAddress("Replace with your street address or locality"); setDescription("Sample description: replace with accurate details about your business."); setAmenities("Wi-Fi, Parking"); }}>✧ Fill Sample Data</button>
        <h1>Add your service</h1>
        <span>Complete details help travellers find your service.</span>

        <form onSubmit={submitListing}>
          <h2 className="ex-form-section">1. Service category &amp; destination</h2>
          <ProviderLocationFields state={listingState} city={listingCity} onStateChange={setListingState} onCityChange={setListingCity} />
          <label>
            Category
            <select value={category} onChange={(e) => { const next = e.target.value; setCategory(next); setPriceUnit(next === "STAY" ? "per night" : next === "FOOD" ? "per person" : next === "PLACE" ? "per entry" : "per vehicle"); }}>
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

          <h2 className="ex-form-section">2. Location &amp; address</h2>
          <label>
            Street address / locality *
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, building or locality"
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

          <h2 className="ex-form-section">3. Tariff &amp; commercials</h2>
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
                <option value="per vehicle">Per vehicle</option>
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

          {listingCity.trim().toLowerCase() === 'bhopal' && listingState === 'Madhya Pradesh' && <button type="button" onClick={() => { setLatitude(String(cityCentre.coordinates!.latitude)); setLongitude(String(cityCentre.coordinates!.longitude)); setCoordinateSource("Bhopal city reference only — property coordinates require confirmation"); }}>Use City Centre GPS (reference only)</button>}
          <small>Replace city reference coordinates with your property's exact location before submitting.</small>
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

          <h2 className="ex-form-section">4. Photos, media &amp; main card cover</h2>
          <label>
            Listing photos
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => setPhotos((current) => [...current, ...Array.from(e.target.files || [])])}
            />
          </label>

          <div className="ex-photo-url"><input type="url" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="Or paste an HTTPS image URL…" aria-label="Image URL" /><button type="button" disabled={importingPhoto || !photoUrl} onClick={importPhoto}>{importingPhoto ? "Importing…" : "Add URL"}</button></div>
          <div className="ex-upload-previews">{photoPreviews.map((url, index) => <div key={url}><img src={url} alt={`Listing photo ${index + 1}`} /><button type="button" onClick={() => setPhotos((current) => [current[index], ...current.filter((_, i) => i !== index)])}>{index === 0 ? "✓ Main Cover" : "Set as Cover"}</button><button type="button" aria-label={`Delete photo ${index + 1}`} onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}>×</button></div>)}</div>
          <h2 className="ex-form-section">5. Trade license &amp; compliance document</h2>
          {proofDocument && <p>Selected file: {proofDocument.name}</p>}
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
            {submitting ? "Submitting..." : "Submit for Verification →"}
          </button>
          <Link className="ex-back" to="/provider">Cancel</Link>
        </form>
      </section>
    </main>
  );
}
