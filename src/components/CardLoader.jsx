import { Card, CardContent, Skeleton, Box } from "@mui/material";

const CardLoader = () => (
  <Card
    sx={{
      display: "flex",
      flexDirection: "column",
      transition: "0.3s",
      "&:hover": { transform: "translateY(-5px)" },
    }}
  >
    {/* Image skeleton */}
    <Skeleton variant="rectangular" height={180} />

    {/* Card content skeleton */}
    <CardContent sx={{ flexGrow: 1 }}>
      <Skeleton variant="text" width="60%" height={28} />
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="80%" />
    </CardContent>

    {/* Action buttons skeleton */}
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, p: 1, borderTop: "1px solid #eee" }}>
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="circular" width={32} height={32} />
    </Box>
  </Card>
);



export default CardLoader;
