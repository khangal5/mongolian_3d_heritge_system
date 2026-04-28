import { randomUUID } from "node:crypto";
import { pool, query } from "../db/pool.js";
import { hashPassword } from "../utils/password.js";

const email = (process.env.ADMIN_EMAIL || "admin@heritage.local").toLowerCase();
const password = process.env.ADMIN_PASSWORD || "Admin1234";
const fullName = process.env.ADMIN_FULL_NAME || "Систем админ";
const organization = process.env.ADMIN_ORGANIZATION || "ШУТИС";
const positionTitle = process.env.ADMIN_POSITION || "Системийн админ";

async function run() {
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD хамгийн багадаа 8 тэмдэгттэй байх ёстой");
  }

  const existing = await query(`SELECT id, role FROM users WHERE email = $1`, [email]);

  if (existing.rowCount) {
    const row = existing.rows[0];
    await query(
      `
        UPDATE users
        SET role = 'admin',
            password_hash = $2,
            verification_status = 'verified',
            status = 'active',
            updated_at = NOW()
        WHERE id = $1
      `,
      [row.id, hashPassword(password)]
    );
    console.log(
      `Хэрэглэгч ${email} -ийг admin роль + шинэ нууц үгээр шинэчиллээ (өмнө: ${row.role})`
    );
    console.log(`Нэвтрэх: ${email} / ${password}`);
    return;
  }

  await query(
    `
      INSERT INTO users (
        id, full_name, email, institution_email, password_hash, role,
        organization, position_title, verification_status, status
      )
      VALUES ($1, $2, LOWER($3), LOWER($3), $4, 'admin', $5, $6, 'verified', 'active')
    `,
    [randomUUID(), fullName, email, hashPassword(password), organization, positionTitle]
  );

  console.log(`Админ үүслээ: ${email} / ${password}`);
}

run()
  .catch((error) => {
    console.error("Админ үүсгэхэд алдаа гарлаа:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });