"use client";

import { useEffect, useState } from "react";
import { getBaseUrl, setBaseUrl } from "../lib/apiClient";

export default function ApiConfigBar() {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(getBaseUrl());
  }, []);

  return (
    <div className="panel">
      <label>API base URL</label>
      <input
        name="baseUrl"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          setBaseUrl(next);
        }}
        placeholder="http://localhost:4000"
      />
      <p className="muted">
        This value is stored locally and used for all requests.
      </p>
    </div>
  );
}
