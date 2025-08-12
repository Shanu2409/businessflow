import getSettingModel from "./control/settings";

const ACTIVE_KEY = "activeDb";
const MAINT_KEY = "maintenance";

export async function getActiveDb() {
  const Setting = await getSettingModel();
  const doc = await Setting.findOne({ key: ACTIVE_KEY });
  return doc?.value || "db1"; // default to db1
}

export async function setActiveDb(value) {
  if (!value || !["db1", "db2"].includes(value)) {
    throw new Error("Invalid active DB value; must be 'db1' or 'db2'");
  }
  const Setting = await getSettingModel();
  await Setting.updateOne(
    { key: ACTIVE_KEY },
    { $set: { value } },
    { upsert: true }
  );
  return value;
}

export async function isMaintenance() {
  const Setting = await getSettingModel();
  const doc = await Setting.findOne({ key: MAINT_KEY });
  return doc?.value === "1";
}

export async function setMaintenance(flag) {
  const Setting = await getSettingModel();
  await Setting.updateOne(
    { key: MAINT_KEY },
    { $set: { value: flag ? "1" : "0" } },
    { upsert: true }
  );
  return !!flag;
}

export default { getActiveDb, setActiveDb, isMaintenance, setMaintenance };
