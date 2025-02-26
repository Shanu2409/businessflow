import { ClipLoader } from "react-spinners";

const FullScreenLoader = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div style={styles.overlay}>
      <ClipLoader size={80} color="#36d7b7" />
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 9999,
  },
};

export default FullScreenLoader;
