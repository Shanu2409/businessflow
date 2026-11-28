import mongoose from "mongoose";

// Runtime-only connection settings (server side, not baked into the build).
// Preferred: MONGODB_HOST + MONGODB_USER + MONGODB_PASSWORD + MONGODB_DB.
// Fallback: NEXT_PUBLIC_MONGODB_URI (original behaviour).
function getUri() {
  const { MONGODB_HOST, MONGODB_USER, MONGODB_PASSWORD, MONGODB_DB } = process.env;
  if (MONGODB_HOST && MONGODB_USER && MONGODB_PASSWORD && MONGODB_DB) {
    return (
      "mongodb+srv://" +
      encodeURIComponent(MONGODB_USER) +
      ":" +
      encodeURIComponent(MONGODB_PASSWORD) +
      "@" +
      MONGODB_HOST +
      "/" +
      encodeURIComponent(MONGODB_DB) +
      "?retryWrites=true&w=majority"
    );
  }
  return process.env.NEXT_PUBLIC_MONGODB_URI;
}

const connection = async () => {
  try {
    await mongoose.connect(getUri());

    console.log("Connected to MongoDB ---------------------------");
  } catch (error) {
    console.log(error + "-----------------------------------");
  }
};

export default connection;
