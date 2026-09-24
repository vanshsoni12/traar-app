import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./ProviderDocumentsPage.css";

type VerificationDocument = {
    id: string;
    document_type: string;
    storage_path: string;
};

export default function ProviderDocumentsPage() {
    const navigate = useNavigate();

    const [documents, setDocuments] = useState<VerificationDocument[]>([]);
    const [documentType, setDocumentType] = useState("Business proof");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadDocuments();
    }, []);

    async function loadDocuments() {
        setLoading(true);

        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) {
            navigate("/provider/login");
            return;
        }

        const { data, error } = await supabase
            .from("verification_documents")
            .select("id, document_type, storage_path")
            .eq("provider_id", authData.user.id);

        if (error) {
            setMessage(error.message);
        } else {
            setDocuments((data || []) as VerificationDocument[]);
        }

        setLoading(false);
    }

    async function uploadDocument() {
        if (!file) {
            setMessage("Choose a PDF or image document first.");
            return;
        }

        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) {
            navigate("/provider/login");
            return;
        }

        setUploading(true);
        setMessage("");

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");

        const path = `${authData.user.id}/provider-documents/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from("provider-documents")
            .upload(path, file);

        if (uploadError) {
            setMessage(uploadError.message);
            setUploading(false);
            return;
        }

        const { error: recordError } = await supabase
            .from("verification_documents")
            .insert({
                provider_id: authData.user.id,
                document_type: documentType,
                storage_path: path,
            });

        if (recordError) {
            setMessage(recordError.message);
            setUploading(false);
            return;
        }

        setFile(null);
        setUploading(false);
        setMessage("Verification document uploaded successfully.");

        await loadDocuments();
    }

    async function viewDocument(storagePath: string) {
        const { data, error } = await supabase.storage
            .from("provider-documents")
            .createSignedUrl(storagePath, 60);

        if (error || !data?.signedUrl) {
            setMessage(error?.message || "Could not open this document.");
            return;
        }

        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }

    async function deleteDocument(document: VerificationDocument) {
        const shouldDelete = window.confirm(
            `Remove this ${document.document_type} document?`
        );

        if (!shouldDelete) return;

        const { error: storageError } = await supabase.storage
            .from("provider-documents")
            .remove([document.storage_path]);

        if (storageError) {
            setMessage(storageError.message);
            return;
        }

        const { error: databaseError } = await supabase
            .from("verification_documents")
            .delete()
            .eq("id", document.id);

        if (databaseError) {
            setMessage(databaseError.message);
            return;
        }

        setDocuments((current) =>
            current.filter((item) => item.id !== document.id)
        );

        setMessage("Document removed successfully.");
    }

    return (
        <main className="provider-documents-page">
            <Link to="/provider" className="provider-documents-back">
                ← Back to provider dashboard
            </Link>

            <section className="provider-documents-card">
                <p>PROVIDER VERIFICATION</p>
                <h1>Manage verification documents</h1>
                <span>
                    These documents are private. Only administrators can inspect them
                    during listing review.
                </span>

                <div className="provider-document-upload">
                    <label>
                        Document type
                        <select
                            value={documentType}
                            onChange={(event) => setDocumentType(event.target.value)}
                        >
                            <option>Business proof</option>
                            <option>Identity proof</option>
                            <option>Address proof</option>
                            <option>Tourism registration</option>
                        </select>
                    </label>

                    <label>
                        Choose document
                        <input
                            type="file"
                            accept="application/pdf,image/png,image/jpeg"
                            onChange={(event) => setFile(event.target.files?.[0] || null)}
                        />
                    </label>

                    <button onClick={uploadDocument} disabled={uploading}>
                        {uploading ? "Uploading..." : "Upload document"}
                    </button>
                </div>

                {message && <p className="provider-document-message">{message}</p>}

                <section className="provider-document-list">
                    <h2>Your private documents</h2>

                    {loading && <p>Loading documents...</p>}

                    {!loading && documents.length === 0 && (
                        <p>No verification document uploaded yet.</p>
                    )}

                    {documents.map((document) => (
                        <article key={document.id} className="provider-document-item">
                            <div>
                                <strong>{document.document_type}</strong>
                                <span>Private admin-review document</span>
                            </div>

                            <div>
                                <button onClick={() => viewDocument(document.storage_path)}>
                                    View
                                </button>

                                <button onClick={() => deleteDocument(document)}>
                                    Remove
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </section>
        </main>
    );
}