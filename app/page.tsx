"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Item = {
  id: string;
  name: string;
  image: string;
};

type Outfit = {
  items: Item[];
  wearCount: number;
  lastWorn?: string;
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [newItem, setNewItem] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // 📊 Analytics
  // 📊 Advanced Analytics

// Sort outfits by wear count
const sortedOutfits = [...outfits].sort(
  (a, b) => b.wearCount - a.wearCount
);

// Top 20%
const topCount = Math.ceil(outfits.length * 0.2);
const topOutfits = sortedOutfits.slice(0, topCount);

// Unused outfits
const unusedOutfits = outfits.filter((o) => o.wearCount === 0);
const totalOutfits = outfits.length;

const mostWorn = outfits.reduce((max, outfit) =>
  outfit.wearCount > (max?.wearCount || 0) ? outfit : max,
  outfits[0]
);

const leastWorn = outfits.reduce((min, outfit) =>
  outfit.wearCount < (min?.wearCount ?? Infinity) ? outfit : min,
  outfits[0]
);

  // Load
  useEffect(() => {
  async function loadItems() {
   try {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading items:", error);
      setErrorMessage(error.message);
      setItems([]);
      return;
    }

    setItems(data || []);
    } catch (err) {
      console.error("Unexpected error loading items:", err);
      setErrorMessage("Failed to load data from Supabase.");
      setItems([]);
    }
  }

  loadItems();
}, []);

  // Save

  useEffect(() => {
    localStorage.setItem("outfits", JSON.stringify(outfits));
  }, [outfits]);

  // Upload
async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onloadend = async () => {
    const imageBase64 = reader.result as string;

    const { data, error } = await supabase
      .from("items")
      .insert([
        {
          name: newItem || "Untitled",
          image: imageBase64,
        },
      ])
      .select();

    if (error) {
      console.error("Error saving item:", error);
      return;
    }

    if (data) {
      setItems([...items, ...data]);
      setNewItem("");
    }
  };

  reader.readAsDataURL(file);
}

  // Select items
  function toggleSelect(index: number) {
    if (selected.includes(index)) {
      setSelected(selected.filter((i) => i !== index));
    } else {
      setSelected([...selected, index]);
    }
  }

  // Save outfit
  function saveOutfit() {
    if (selected.length === 0) return;

    const newOutfit: Outfit = {
      items: selected.map((i) => items[i]),
      wearCount: 0,
    };

    setOutfits([...outfits, newOutfit]);
    setSelected([]);
  }

  // Wear tracking
  function wearOutfit(index: number) {
    const updated = [...outfits];
    updated[index].wearCount += 1;
    updated[index].lastWorn = new Date().toLocaleDateString();

    setOutfits(updated);
  }
const deleteItem = async (index: number) => {
  const itemToDelete = items[index];

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemToDelete.id);

  if (error) {
    console.error("Error deleting item:", error);
    return;
  }

  const updated = items.filter((_, i) => i !== index);
  setItems(updated);
  setSelected(selected.filter((i) => i !== index));
};

  // also remove from selected if needed
  setSelected(selected.filter((i) => i !== index));
};
  return (
  <div style={{ padding: 30, fontFamily: "Arial", maxWidth: 1000, margin: "auto" }}>
    <h1 style={{ fontSize: 32, fontWeight: "bold" }}>
      👕 Digital Wardrobe
    </h1>

    {errorMessage && (
      <p style={{ color: "red", marginTop: 10 }}>
       Error: {errorMessage}
     </p>
    )}

    <p style={{ color: "#666" }}>
      Track your outfits and usage
    </p>

    {/* INPUT */}
    <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
      <input
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        placeholder="Item name"
        style={{
          padding: 10,
          borderRadius: 6,
          border: "1px solid #ccc",
          flex: 1,
        }}
      />
      <input type="file" onChange={handleImageUpload} />
    </div>

    {/* WARDROBE */}
    <h2 style={{ marginTop: 30 }}>My Clothes</h2>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 15,
        marginTop: 10,
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          onClick={() => toggleSelect(index)}
          style={{
            border: selected.includes(index)
              ? "3px solid #007bff"
              : "1px solid #ddd",
            borderRadius: 10,
            overflow: "hidden",
            cursor: "pointer",
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            transition: "0.2s",
          }}
        >
          <img
            src={item.image}
            style={{
              width: "100%",
              height: 120,
              objectFit: "cover",
            }}
          />
          <div style={{ padding: 8 }}>
            <p style={{ fontSize: 14 }}>{item.name}</p>
            <button
  onClick={(e) => {
    e.stopPropagation(); // IMPORTANT (prevents selecting item)
    deleteItem(index);
  }}
  style={{
    marginTop: 5,
    padding: "4px 8px",
    fontSize: 12,
    background: "red",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  }}
>
  Delete
</button>
          </div>
        </div>
      ))}
    </div>

    {/* SAVE BUTTON */}
    <button
      onClick={saveOutfit}
      style={{
        marginTop: 20,
        padding: "10px 16px",
        borderRadius: 8,
        background: "#007bff",
        color: "white",
        border: "none",
        cursor: "pointer",
      }}
    >
      Save Outfit
    </button>

    {/* INSIGHTS */}
    <h2 style={{ marginTop: 40 }}>📊 Insights</h2>

    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ background: "#f5f5f5", padding: 10, borderRadius: 8 }}>
        Total: {totalOutfits}
      </div>
      <div style={{ background: "#f5f5f5", padding: 10, borderRadius: 8 }}>
        Most: {mostWorn?.wearCount || 0}
      </div>
      <div style={{ background: "#f5f5f5", padding: 10, borderRadius: 8 }}>
        Least: {leastWorn?.wearCount || 0}
      </div>
    </div>
    <p>
  Top 20% outfits: {topOutfits.length}
</p>

<p>
  Unused outfits: {unusedOutfits.length}
</p>

{unusedOutfits.length > 0 && (
  <p style={{ marginTop: 10, color: "red" }}>
    You have {unusedOutfits.length} outfits you never wear.
  </p>
)}

{topOutfits.length > 0 && (
  <p style={{ marginTop: 10, fontWeight: "bold" }}>
    Your top outfits dominate your wardrobe usage.
  </p>
)}

    {/* OUTFITS */}
    <h2 style={{ marginTop: 40 }}>Saved Outfits</h2>

    {outfits.map((outfit, idx) => (
      <div
        key={idx}
        style={{
          marginTop: 15,
          padding: 10,
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          {outfit.items.map((item, i) => (
            <img
              key={i}
              src={item.image}
              style={{ width: 60, height: 60, borderRadius: 6 }}
            />
          ))}
        </div>

        <p style={{ marginTop: 5 }}>Worn: {outfit.wearCount}</p>

        <button
          onClick={() => wearOutfit(idx)}
          style={{
            marginTop: 5,
            padding: "6px 10px",
            borderRadius: 6,
            border: "none",
            background: "#28a745",
            color: "white",
            cursor: "pointer",
          }}
        >
          I wore this
        </button>
      </div>
    ))}
  </div>
);
}