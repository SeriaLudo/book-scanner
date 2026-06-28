import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const bookCondition = pgEnum('book_condition', [
  'new',
  'like_new',
  'very_good',
  'good',
  'acceptable',
]);

export const bookFormat = pgEnum('book_format', [
  'hardcover',
  'paperback',
  'trade_paperback',
  'mass_market_paperback',
  'other',
]);

const timestamps = {
  createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {withTimezone: true}).defaultNow().notNull(),
};

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkUserId: text('clerk_user_id').notNull(),
    email: text('email'),
    ...timestamps,
  },
  (table) => [uniqueIndex('users_clerk_user_id_idx').on(table.clerkUserId)]
);

export const groups = pgTable(
  'groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, {onDelete: 'cascade'})
      .notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    ...timestamps,
  },
  (table) => [
    unique('groups_user_slug_unique').on(table.userId, table.slug),
    index('groups_user_id_idx').on(table.userId),
  ]
);

export const books = pgTable(
  'books',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, {onDelete: 'cascade'})
      .notNull(),
    isbn: text('isbn').notNull(),
    title: text('title').notNull(),
    authors: text('authors').array().default([]).notNull(),
    groupId: uuid('group_id').references(() => groups.id, {onDelete: 'set null'}),
    condition: bookCondition('condition').default('good').notNull(),
    format: bookFormat('format').default('paperback').notNull(),
    ...timestamps,
  },
  (table) => [
    unique('books_user_isbn_group_unique').on(table.userId, table.isbn, table.groupId),
    index('books_user_id_idx').on(table.userId),
    index('books_group_id_idx').on(table.groupId),
  ]
);

export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Book = typeof books.$inferSelect;
