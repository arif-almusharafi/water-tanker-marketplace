import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "./UI";

// A small "رقم الطلب" form. Opens #/tracking?ref=<reference>.
export default function RefLookup({ navigate, initial = "" }) {
  const [value, setValue] = useState(initial);
  function submit(e) {
    e.preventDefault();
    const ref = value.trim().toUpperCase();
    if (ref) navigate(`tracking?ref=${encodeURIComponent(ref)}`);
  }
  return (
    <form className="ref-lookup" onSubmit={submit}>
      <label>
        رقم الطلب
        <input
          name="reference"
          dir="ltr"
          autoComplete="off"
          placeholder="MW-XXXXXXXX"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <Button type="submit" secondary>
        <Search size={17} aria-hidden="true" /> عرض الطلب
      </Button>
    </form>
  );
}
