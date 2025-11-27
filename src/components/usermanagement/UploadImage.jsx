import { Box, Typography } from "@mui/material";

export default function UploadImage({ label, image, setImage, error, baseURL = "" }) {
  // Determine the src: URL string from API or local File object
  const getImageSrc = () => {
    if (!image) return null;
    if (typeof image === "string") {
      return image.startsWith("http") ? image : `${baseURL}${image}`;
    }
    return URL.createObjectURL(image);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setImage("");
    const input = document.getElementById(`${label}-upload`);
    if (input) input.value = null;
  };

  return (
    <>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {label}
      </Typography>

      <Box
        sx={{
          width: 150,
          height: 150,
          border: "2px dashed #ccc",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: "pointer",
          overflow: "hidden",
          borderColor: error ? "error.main" : "#ccc",
          "&:hover": { borderColor: "primary.main" },
        }}
        onClick={() => document.getElementById(`${label}-upload`)?.click()}
      >
        {image ? (
          <>
            <img
              src={getImageSrc()}
              alt={label}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                bgcolor: "rgba(0,0,0,0.6)",
                borderRadius: "50%",
                p: 0.5,
                cursor: "pointer",
              }}
              onClick={handleClear}
            >
              <Typography sx={{ color: "white", fontSize: 14 }}>✕</Typography>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Click to Upload
          </Typography>
        )}
      </Box>

      <input
        id={`${label}-upload`}
        hidden
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files[0] && setImage(e.target.files[0])}
      />

      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </>
  );
}
