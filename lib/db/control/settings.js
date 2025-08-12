import { Schema } from "mongoose";
import getControlConn from "./connection";

export async function getSettingModel() {
  const conn = await getControlConn();
  const settingSchema = new Schema(
    {
      key: { type: String, required: true, unique: true },
      value: { type: String, required: true },
    },
    { timestamps: true, collection: "settings" }
  );
  return conn.models.Setting || conn.model("Setting", settingSchema);
}

export default getSettingModel;
