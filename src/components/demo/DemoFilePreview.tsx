import { useEffect, useState } from "react";

const DemoFilePreview = ({ file, alt, className = "mt-3 h-40 w-full rounded-xl object-cover" }: {
  file: File | null | undefined;
  alt: string;
  className?: string;
}) => {
  const [source, setSource] = useState("");

  useEffect(() => {
    if (!file?.type.startsWith("image/") || typeof URL.createObjectURL !== "function") {
      setSource("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setSource(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return source ? <img src={source} alt={alt} className={className} /> : null;
};

export default DemoFilePreview;
