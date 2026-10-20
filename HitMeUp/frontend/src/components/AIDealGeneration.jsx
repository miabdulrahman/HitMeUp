import { useState } from "react";
import { generateDeals } from "../services/aiService";

export default function AIDealGeneration() {
    const [form, setForm] = useState({
        businessName: "",
        businessType: "",
        productOrService: "",
        originalPrice: "",
        targetCustomers: "",
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(agent);
        setError("");
        setResult(null);

        try {
            const data = await generateDeals({
                ...form,
                originalPrice: Number(form.originalPrice),
            })

            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">
                AI Deal Generator
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
                {Object.keys(form).map((field) => (
                    <div key={field}>
                        <label className="block mb-1 capitalize">
                            {field.replace(/([A-Z])/g, " $1")}
                        </label>
                        <input
                            type={field === "originalPrice" ? "number" : "text"}
                            min={field === "originalPrice" ? "0" : undefined}
                            required
                            value={form[field]}
                            onChange={(e) =>
                                setForm({ ...form, [field]: e.target.value })
                            }
                            className="w-full border rounded p-2"
                        />
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    {loading ? "Generating..." : "Generate AI Deal"}
                </button>
            </form>

            {error && (
                <p role="alert" className="text-red-600 mt-4">
                    {error}
                </p>
            )}

            {result && (
                <div className="mt-6 p-4 bg-gray-100 rounded text-gray-900">
                    <h3 className="font-bold mb-2">AI Generated Result</h3>
                    <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}