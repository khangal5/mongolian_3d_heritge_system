import { test } from "node:test";
import assert from "node:assert/strict";

// Enums
import { Role, isValidRole } from "../src/entities/Role.js";
import { VerifyStatus, isValidVerifyStatus } from "../src/entities/VerifyStatus.js";

// Entities
import { AuthResponse } from "../src/entities/AuthResponse.js";
import { SearchCriteria } from "../src/entities/SearchCriteria.js";
import { User } from "../src/entities/User.js";

// Repositories
import { UserRepository } from "../src/data/UserRepository.js";
import { MediaRepository } from "../src/data/MediaRepository.js";
import { LocationRepository } from "../src/data/LocationRepository.js";
import { PhotoSetRepository } from "../src/data/PhotoSetRepository.js";
import { ReconstructionJobRepository } from "../src/data/ReconstructionJobRepository.js";
import { ArtifactRepository } from "../src/data/ArtifactRepository.js";

// Services
import { MediaService } from "../src/services/MediaService.js";
import { LocationService } from "../src/services/LocationService.js";

// Controllers
import { AdminController } from "../src/controllers/AdminController.js";

test("Role enum нь зөв утгуудтай", () => {
  assert.equal(Role.RESEARCHER, "researcher");
  assert.equal(Role.ADMIN, "admin");
  assert.equal(isValidRole("admin"), true);
  assert.equal(isValidRole("random"), false);
});

test("VerifyStatus enum нь зөв утгуудтай", () => {
  assert.equal(VerifyStatus.SUBMITTED, "submitted");
  assert.equal(VerifyStatus.VERIFIED, "verified");
  assert.equal(isValidVerifyStatus("verified"), true);
});

test("AuthResponse user, token талбартай", () => {
  const u = new User({ id: "1", email: "a@b.mn" });
  const resp = new AuthResponse({ user: u, token: "abc123" });
  assert.equal(resp.token, "abc123");
  assert.ok(resp.user instanceof User);
  const json = resp.toJSON();
  assert.equal(json.token, "abc123");
  assert.equal(json.user.email, "a@b.mn");
});

test("SearchCriteria нь сонголтуудыг агуулна", () => {
  const c = new SearchCriteria({ name: "буган", province: "Архангай" });
  assert.equal(c.name, "буган");
  assert.equal(c.province, "Архангай");
  assert.equal(c.hasKeyword(), true);
});

test("UserRepository instantiate хийгдэнэ", () => {
  const r = new UserRepository();
  assert.equal(typeof r.save, "function");
  assert.equal(typeof r.findByEmail, "function");
  assert.equal(typeof r.findById, "function");
});

test("MediaRepository нь save, findByArtifactId функцтэй", () => {
  const r = new MediaRepository();
  assert.equal(typeof r.save, "function");
  assert.equal(typeof r.findByArtifactId, "function");
});

test("LocationRepository, PhotoSetRepository, ReconstructionJobRepository instantiate", () => {
  assert.ok(new LocationRepository());
  assert.ok(new PhotoSetRepository());
  assert.ok(new ReconstructionJobRepository());
});

test("ArtifactRepository нь searchArtifact функцтэй", () => {
  const r = new ArtifactRepository();
  assert.equal(typeof r.searchArtifact, "function");
  assert.equal(typeof r.save, "function");
  assert.equal(typeof r.findById, "function");
});

test("MediaService нь validateFileType функцтэй", () => {
  const s = new MediaService();
  assert.equal(s.validateFileType({ mimetype: "image/jpeg" }), true);
  assert.equal(s.validateFileType({ mimetype: "application/pdf" }), false);
  assert.equal(s.validateFileType({ originalname: "model.glb" }), true);
  assert.equal(s.validateFileType({ originalname: "x.exe" }), false);
});

test("LocationService нь setLocation, getLocation функцтэй", () => {
  const s = new LocationService();
  assert.equal(typeof s.setLocation, "function");
  assert.equal(typeof s.getLocation, "function");
});

test("AdminController нь approve, reject, listPending функцтэй", () => {
  const c = new AdminController();
  assert.equal(typeof c.approve, "function");
  assert.equal(typeof c.reject, "function");
  assert.equal(typeof c.listPending, "function");
});
