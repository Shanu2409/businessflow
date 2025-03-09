import mongoose from "mongoose";

const connection = async () => {
  try {
    await mongoose.connect(process.env.NEXT_PUBLIC_MONGODB_URI);

    console.log("Connected to MongoDB ---------------------------");
  } catch (error) {
    console.log(error + "-----------------------------------");
  }
};

export default connection;
