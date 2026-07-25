import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "active",
  "sold_out",
  "ended",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_approval",
  "approved",
  "rejected",
  "completed",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "reserved",
  "sold",
  "cancelled",
  "used",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "verified",
  "rejected",
]);

export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "admin"]);

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  titleJa: varchar("title_ja", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleZh: varchar("title_zh", { length: 255 }).notNull(),
  descriptionJa: text("description_ja"),
  descriptionEn: text("description_en"),
  descriptionZh: text("description_zh"),
  venue: varchar("venue", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }),
  eventDate: timestamp("event_date").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  status: eventStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventDates = pgTable("event_dates", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  date: timestamp("date").notNull(),
  label: varchar("label", { length: 100 }),
});

export const ticketTiers = pgTable("ticket_tiers", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  nameJa: varchar("name_ja", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameZh: varchar("name_zh", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantityTotal: integer("quantity_total").notNull(),
  quantitySold: integer("quantity_sold").default(0).notNull(),
  isActive: varchar("is_active", { length: 5 }).default("true").notNull(),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  tierId: uuid("tier_id")
    .references(() => ticketTiers.id, { onDelete: "cascade" })
    .notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  ticketCode: varchar("ticket_code", { length: 20 }).notNull().unique(),
  password: varchar("password", { length: 50 }).notNull(),
  qrData: text("qr_data"),
  status: ticketStatusEnum("status").default("reserved").notNull(),
  issuedAt: timestamp("issued_at"),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }),
  paymentScreenshotUrl: text("payment_screenshot_url"),
  status: orderStatusEnum("status").default("pending_approval").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  ticketId: uuid("ticket_id")
    .references(() => tickets.id, { onDelete: "cascade" })
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  method: varchar("method", { length: 50 }).default("paypay").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  screenshotUrl: text("screenshot_url"),
  verifiedBy: uuid("verified_by").references(() => adminUsers.id),
  status: paymentStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: adminRoleEnum("role").default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  status: varchar("status", { length: 20 }).default("sent").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const scrapedEventStatusEnum = pgEnum("scraped_event_status", [
  "pending",
  "created",
  "ignored",
]);

export const scrapedEvents = pgTable("scraped_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: varchar("source", { length: 50 }).notNull(),
  sourceUrl: varchar("source_url", { length: 1000 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  venue: varchar("venue", { length: 255 }),
  eventDate: varchar("event_date", { length: 100 }),
  imageUrl: varchar("image_url", { length: 1000 }),
  rawHtml: text("raw_html"),
  status: scrapedEventStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
