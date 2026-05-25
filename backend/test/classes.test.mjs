import { test } from "node:test";
import assert from "node:assert/strict";
import { User, Researcher, Admin } from "../src/entities/User.js";
import { Artifact, ArtifactStatus } from "../src/entities/Artifact.js";
import { Location } from "../src/entities/Location.js";
import { MediaFile } from "../src/entities/MediaFile.js";
import { PhotoSet, PhotoImage, ReconstructionJob, JobStatus } from "../src/entities/PhotoSet.js";

test("User класс нь үндсэн талбаруудыг агуулдаг", () => {
  const u = new User({ id: "1", full_name: "Бат", email: "b@a.mn", role: "researcher" });
  assert.equal(u.id, "1");
  assert.equal(u.fullName, "Бат");
  assert.equal(u.email, "b@a.mn");
  assert.equal(u.isResearcher(), true);
  assert.equal(u.isAdmin(), false);
});

test("Researcher, Admin классууд User-ээс өвлөдөг", () => {
  const r = new Researcher({ id: "1" });
  const a = new Admin({ id: "2" });
  assert.ok(r instanceof User);
  assert.ok(a instanceof User);
  assert.equal(r.role, "researcher");
  assert.equal(a.role, "admin");
});

test("Artifact класс нь төлвийн шалгалттай", () => {
  const a = new Artifact({ name: "Test", status: ArtifactStatus.APPROVED });
  assert.equal(a.isApproved(), true);
  assert.equal(a.isPending(), false);
});

test("Artifact.canBeEditedBy зөвхөн эзэмшигч ба NEW төлөвт зөвшөөрнө", () => {
  const owner = new User({ id: "u1", role: "researcher" });
  const admin = new Admin({ id: "u2" });
  const newArt = new Artifact({ status: ArtifactStatus.NEW, createdByUserId: "u1" });
  const approvedArt = new Artifact({ status: ArtifactStatus.APPROVED, createdByUserId: "u1" });

  assert.equal(newArt.canBeEditedBy(owner), true);
  assert.equal(approvedArt.canBeEditedBy(owner), false);
  assert.equal(approvedArt.canBeEditedBy(admin), true);
});

test("MediaFile төрлийн шалгалт", () => {
  const img = new MediaFile({ file_type: "image" });
  const mdl = new MediaFile({ file_type: "model" });
  assert.equal(img.isImage(), true);
  assert.equal(mdl.isModel(), true);
});

test("Location toJSON нь зөв бүтэцтэй", () => {
  const l = new Location({ province: "Архангай", location: "Гол-Мод", latitude: 47.5, longitude: 101.3 });
  const json = l.toJSON();
  assert.equal(json.province, "Архангай");
  assert.equal(json.coordinates.lat, 47.5);
  assert.equal(json.coordinates.lng, 101.3);
});

test("PhotoSet, PhotoImage, ReconstructionJob классууд", () => {
  const set = new PhotoSet({
    id: "ps1",
    title: "Гол-Мод буган хөшөө",
    images: [{ file_name: "a.jpg" }, { file_name: "b.jpg" }],
    job: { status: JobStatus.QUEUE }
  });
  assert.equal(set.imageCount(), 2);
  assert.ok(set.images[0] instanceof PhotoImage);
  assert.ok(set.job instanceof ReconstructionJob);
  assert.equal(set.job.isQueued(), true);
});
