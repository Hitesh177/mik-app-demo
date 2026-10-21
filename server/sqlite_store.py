#!/usr/bin/env python3
import datetime as dt
import hashlib
import json
import sqlite3
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / 'data' / 'mik.sqlite'


def utc_now_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z')


def ensure_dir():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def connect():
    ensure_dir()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


def hash_password(password, salt):
    data = password.encode('utf-8')
    salt_bytes = salt.encode('utf-8')
    try:
        return hashlib.scrypt(data, salt=salt_bytes, n=16384, r=8, p=1, dklen=64).hex()
    except Exception:
        return hashlib.pbkdf2_hmac('sha256', data, salt_bytes, 150_000, dklen=64).hex()


def hash_token(token):
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def rows_to_dicts(rows):
    return [dict(row) for row in rows]


def save_wix_session(conn, sid, kind, payload, expires_at):
    conn.execute(
        '''
        INSERT INTO wix_sessions(sid, kind, payload, created_at, expires_at)
        VALUES(?, ?, ?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET
            kind = excluded.kind,
            payload = excluded.payload,
            expires_at = excluded.expires_at
        ''',
        (sid, kind, payload, utc_now_iso(), expires_at),
    )
    conn.commit()
    return {'saved': True}


def get_wix_session(conn, sid, kind):
    row = conn.execute(
        'SELECT payload, expires_at FROM wix_sessions WHERE sid = ? AND kind = ?',
        (sid, kind),
    ).fetchone()
    if not row:
        return None
    expires_at = dt.datetime.fromisoformat(str(row['expires_at']).replace('Z', '+00:00'))
    if expires_at <= dt.datetime.now(dt.timezone.utc):
        conn.execute('DELETE FROM wix_sessions WHERE sid = ?', (sid,))
        conn.commit()
        return None
    return {'payload': row['payload'], 'expires_at': row['expires_at']}


def delete_wix_session(conn, sid):
    conn.execute('DELETE FROM wix_sessions WHERE sid = ?', (sid,))
    conn.commit()
    return {'deleted': True}


def slugify(value):
    text = str(value or '').lower().strip()
    chars = []
    last_dash = False
    for ch in text:
      if ch.isalnum():
        chars.append(ch)
        last_dash = False
      elif ch in {' ', '-', '_', '/', '(', ')', ',', '.', '&', '+'}:
        if not last_dash and chars:
          chars.append('-')
          last_dash = True
    slug = ''.join(chars).strip('-')
    while '--' in slug:
        slug = slug.replace('--', '-')
    return slug


def normalize_actor(payload):
    actor = payload.get('_actor') or {}
    if not isinstance(actor, dict):
        actor = {}
    return {
        'type': str(actor.get('type') or 'system').strip() or 'system',
        'id': str(actor.get('id') or actor.get('email') or '').strip(),
        'email': str(actor.get('email') or '').strip(),
    }


def record_audit_log(conn, actor, action, entity_type, entity_id='', summary=''):
    conn.execute(
        '''
        INSERT INTO admin_audit_logs(actor_type, actor_id, action, entity_type, entity_id, summary, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            str(actor.get('type') or 'system'),
            str(actor.get('id') or ''),
            str(action or ''),
            str(entity_type or ''),
            str(entity_id or ''),
            str(summary or ''),
            utc_now_iso(),
        ),
    )


def record_order_event(conn, order_id, status, note, actor=None):
    actor = actor or {}
    conn.execute(
        '''
        INSERT INTO order_events(order_id, status, note, actor_type, actor_id, created_at)
        VALUES(?, ?, ?, ?, ?, ?)
        ''',
        (
            order_id,
            str(status or ''),
            str(note or ''),
            str(actor.get('type') or 'system'),
            str(actor.get('id') or ''),
            utc_now_iso(),
        ),
    )


def fetch_order_events(conn, order_id):
    rows = conn.execute(
        '''
        SELECT status, note, actor_type, actor_id, created_at
        FROM order_events
        WHERE order_id = ?
        ORDER BY created_at ASC, id ASC
        ''',
        (order_id,),
    ).fetchall()
    return rows_to_dicts(rows)


def attach_order_meta(conn, order_row):
    order = dict(order_row)
    items = conn.execute(
        '''
        SELECT product_id, name, price, quantity
        FROM order_items
        WHERE order_id = ?
        ORDER BY sort_order ASC, id ASC
        ''',
        (order['id'],),
    ).fetchall()
    order['items'] = rows_to_dicts(items)
    order['events'] = fetch_order_events(conn, order['id'])
    return order


def fetch_products(conn):
    rows = conn.execute(
        '''
        SELECT id, name_en, name_zh, seo_slug, seo_title, seo_description, seo_keywords, seo_h1, seo_content,
               price, category, stock, image_url, badge, created_at
        FROM products
        ORDER BY created_at DESC, id DESC
        '''
    ).fetchall()
    return rows_to_dicts(rows)


def fetch_orders(conn):
    order_rows = conn.execute(
        '''
        SELECT id, order_number, customer_name, customer_phone, customer_address,
               subtotal, total, delivery_note, status, payment_method, created_at,
               customer_id, points_earned, points_redeemed, discount_amount,
               coupon_id, coupon_code, coupon_discount_amount
        FROM orders
        ORDER BY created_at DESC, id DESC
        '''
    ).fetchall()
    orders = []
    for row in order_rows:
        orders.append(attach_order_meta(conn, row))
    return orders


def ensure_schema(conn):
    conn.executescript(
        '''
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS admin_users (
            email TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name_en TEXT NOT NULL,
            name_zh TEXT NOT NULL DEFAULT '',
            seo_slug TEXT NOT NULL DEFAULT '',
            seo_title TEXT NOT NULL DEFAULT '',
            seo_description TEXT NOT NULL DEFAULT '',
            seo_keywords TEXT NOT NULL DEFAULT '',
            seo_h1 TEXT NOT NULL DEFAULT '',
            seo_content TEXT NOT NULL DEFAULT '',
            price INTEGER NOT NULL,
            category TEXT NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            image_url TEXT,
            badge TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_number TEXT NOT NULL UNIQUE,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_address TEXT NOT NULL,
            subtotal INTEGER NOT NULL,
            total INTEGER NOT NULL,
            delivery_note TEXT NOT NULL,
            status TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            sort_order INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            sid TEXT PRIMARY KEY,
            admin_email TEXT NOT NULL,
            refresh_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            refresh_expires_at TEXT NOT NULL,
            revoked_at TEXT
        );

        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            google_sub TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            avatar_url TEXT,
            phone TEXT NOT NULL DEFAULT '',
            address TEXT NOT NULL DEFAULT '',
            points INTEGER NOT NULL DEFAULT 0,
            lifetime_spend INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS customer_sessions (
            sid TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            refresh_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            refresh_expires_at TEXT NOT NULL,
            revoked_at TEXT
        );

        CREATE TABLE IF NOT EXISTS wix_sessions (
            sid TEXT PRIMARY KEY,
            kind TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS customer_point_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            order_id TEXT,
            type TEXT NOT NULL,
            points INTEGER NOT NULL,
            note TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS customer_cart_items (
            customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (customer_id, product_id)
        );

        CREATE TABLE IF NOT EXISTS order_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            status TEXT NOT NULL,
            note TEXT NOT NULL,
            actor_type TEXT NOT NULL DEFAULT 'system',
            actor_id TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS coupons (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            discount_type TEXT NOT NULL,
            discount_value INTEGER NOT NULL DEFAULT 0,
            min_order_amount INTEGER NOT NULL DEFAULT 0,
            max_discount_amount INTEGER NOT NULL DEFAULT 0,
            usage_limit_total INTEGER NOT NULL DEFAULT 0,
            usage_limit_per_customer INTEGER NOT NULL DEFAULT 0,
            start_at TEXT,
            end_at TEXT,
            active INTEGER NOT NULL DEFAULT 1,
            first_order_only INTEGER NOT NULL DEFAULT 0,
            apply_scope TEXT NOT NULL DEFAULT 'order',
            target_value TEXT NOT NULL DEFAULT '',
            stackable INTEGER NOT NULL DEFAULT 0,
            times_used INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS coupon_redemptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            coupon_id TEXT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
            coupon_code TEXT NOT NULL,
            order_id TEXT NOT NULL,
            customer_id TEXT,
            discount_amount INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS hero_offers (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            subtitle TEXT NOT NULL DEFAULT '',
            tag TEXT NOT NULL DEFAULT '',
            cta_label TEXT NOT NULL DEFAULT '',
            href TEXT NOT NULL DEFAULT '/',
            emoji TEXT NOT NULL DEFAULT '✨',
            bg_from TEXT NOT NULL DEFAULT 'from-green-700',
            bg_to TEXT NOT NULL DEFAULT 'to-green-900',
            accent TEXT NOT NULL DEFAULT 'bg-white/20',
            sort_order INTEGER NOT NULL DEFAULT 0,
            active INTEGER NOT NULL DEFAULT 1,
            start_at TEXT,
            end_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS admin_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor_type TEXT NOT NULL,
            actor_id TEXT NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL DEFAULT '',
            summary TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );
        '''
    )

    existing_columns = {
        row['name']
        for row in conn.execute('PRAGMA table_info(orders)').fetchall()
    }
    order_migrations = [
        ('customer_id', "TEXT"),
        ('points_earned', "INTEGER NOT NULL DEFAULT 0"),
        ('points_redeemed', "INTEGER NOT NULL DEFAULT 0"),
        ('discount_amount', "INTEGER NOT NULL DEFAULT 0"),
        ('coupon_id', "TEXT"),
        ('coupon_code', "TEXT NOT NULL DEFAULT ''"),
        ('coupon_discount_amount', "INTEGER NOT NULL DEFAULT 0"),
    ]
    for column, definition in order_migrations:
        if column not in existing_columns:
            conn.execute(f'ALTER TABLE orders ADD COLUMN {column} {definition}')

    product_columns = {
        row['name']
        for row in conn.execute('PRAGMA table_info(products)').fetchall()
    }
    product_migrations = [
        ('seo_slug', "TEXT NOT NULL DEFAULT ''"),
        ('seo_title', "TEXT NOT NULL DEFAULT ''"),
        ('seo_description', "TEXT NOT NULL DEFAULT ''"),
        ('seo_keywords', "TEXT NOT NULL DEFAULT ''"),
        ('seo_h1', "TEXT NOT NULL DEFAULT ''"),
        ('seo_content', "TEXT NOT NULL DEFAULT ''"),
    ]
    for column, definition in product_migrations:
        if column not in product_columns:
            conn.execute(f'ALTER TABLE products ADD COLUMN {column} {definition}')

    conn.commit()


def next_order_number(conn):
    row = conn.execute("SELECT value FROM meta WHERE key = 'next_order_number'").fetchone()
    if row and row['value']:
        return int(row['value'])

    max_num = 0
    order_rows = conn.execute('SELECT order_number FROM orders').fetchall()
    for order_row in order_rows:
        digits = ''.join(ch for ch in str(order_row['order_number']) if ch.isdigit())
        if digits:
            max_num = max(max_num, int(digits))
    return max_num + 1


def set_meta(conn, key, value):
    conn.execute(
        'INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        (key, str(value)),
    )


def seed_database(conn, seed):
    if conn.execute('SELECT COUNT(*) AS c FROM products').fetchone()['c'] > 0:
        return {'seeded': False}

    admin = seed.get('admin') or {}
    admin_email = str(admin.get('email') or 'admin@mik.store').strip().lower()
    admin_password = str(admin.get('password') or 'mik2024')
    admin_salt = 'mik-store-admin-salt'
    conn.execute(
        'INSERT OR REPLACE INTO admin_users(email, password_hash, salt) VALUES(?, ?, ?)',
        (admin_email, hash_password(admin_password, admin_salt), admin_salt),
    )

    products = seed.get('products') or []
    for product in products:
        conn.execute(
            '''
            INSERT INTO products(id, name_en, name_zh, price, category, stock, image_url, badge, created_at)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                str(product.get('id') or uuid.uuid4()),
                str(product.get('name_en') or '').strip(),
                str(product.get('name_zh') or '').strip(),
                int(product.get('price') or 0),
                str(product.get('category') or 'spices'),
                int(product.get('stock') or 0),
                product.get('image_url'),
                product.get('badge'),
                str(product.get('created_at') or utc_now_iso()),
            ),
        )

    orders = seed.get('orders') or []
    max_order_number = 0
    for order_index, order in enumerate(orders):
        order_id = str(order.get('id') or f'ord-{uuid.uuid4()}')
        order_number = str(order.get('order_number') or f'#{order_index + 1:03d}')
        digits = ''.join(ch for ch in order_number if ch.isdigit())
        if digits:
            max_order_number = max(max_order_number, int(digits))

        conn.execute(
            '''
            INSERT INTO orders(id, order_number, customer_name, customer_phone, customer_address,
                               subtotal, total, delivery_note, status, payment_method, created_at)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                order_id,
                order_number,
                str(order.get('customer_name') or ''),
                str(order.get('customer_phone') or ''),
                str(order.get('customer_address') or ''),
                int(order.get('subtotal') or 0),
                int(order.get('total') or 0),
                str(order.get('delivery_note') or 'Free delivery in Taiwan'),
                str(order.get('status') or 'pending'),
                str(order.get('payment_method') or 'paytm'),
                str(order.get('created_at') or utc_now_iso()),
            ),
        )

        for item_index, item in enumerate(order.get('items') or []):
            conn.execute(
                '''
                INSERT INTO order_items(order_id, product_id, name, price, quantity, sort_order)
                VALUES(?, ?, ?, ?, ?, ?)
                ''',
                (
                    order_id,
                    str(item.get('product_id') or item.get('id') or ''),
                    str(item.get('name') or ''),
                    int(item.get('price') or 0),
                    int(item.get('quantity') or item.get('qty') or 1),
                    item_index,
                ),
            )

    set_meta(conn, 'next_order_number', max_order_number + 1)
    conn.commit()
    return {'seeded': True}


def verify_admin(conn, email, password):
    row = conn.execute(
        'SELECT email, password_hash, salt FROM admin_users WHERE email = ?',
        (email.lower(),),
    ).fetchone()
    if not row:
        return {'ok': False}
    if hash_password(password, row['salt']) != row['password_hash']:
        return {'ok': False}
    return {'ok': True, 'admin': {'email': row['email']}}


def create_session(conn, sid, admin_email, refresh_token, refresh_expires_at):
    conn.execute(
        '''
        INSERT INTO sessions(sid, admin_email, refresh_hash, created_at, refresh_expires_at, revoked_at)
        VALUES(?, ?, ?, ?, ?, NULL)
        ''',
        (sid, admin_email, hash_token(refresh_token), utc_now_iso(), refresh_expires_at),
    )
    conn.commit()
    return {'ok': True}


def validate_session(conn, sid):
    row = conn.execute(
        '''
        SELECT sid, admin_email, refresh_expires_at, revoked_at
        FROM sessions
        WHERE sid = ?
        ''',
        (sid,),
    ).fetchone()
    if not row:
        return {'active': False}
    if row['revoked_at']:
        return {'active': False}
    if row['refresh_expires_at'] <= utc_now_iso():
        return {'active': False}
    return {'active': True, 'admin_email': row['admin_email']}


def validate_refresh_session(conn, sid, refresh_token):
    row = conn.execute(
        '''
        SELECT sid, admin_email, refresh_hash, refresh_expires_at, revoked_at
        FROM sessions
        WHERE sid = ?
        ''',
        (sid,),
    ).fetchone()
    if not row:
        return {'active': False}
    if row['revoked_at']:
        return {'active': False}
    if row['refresh_expires_at'] <= utc_now_iso():
        return {'active': False}
    if row['refresh_hash'] != hash_token(refresh_token):
        return {'active': False}
    return {'active': True, 'admin_email': row['admin_email']}


def revoke_session(conn, sid):
    conn.execute(
        'UPDATE sessions SET revoked_at = ? WHERE sid = ?',
        (utc_now_iso(), sid),
    )
    conn.commit()
    return {'ok': True}


def hash_order_points(points):
    return int(points or 0)


def get_customer_by_id(conn, customer_id):
    row = conn.execute(
        '''
        SELECT id, google_sub, email, name, avatar_url, phone, address, points, lifetime_spend, created_at, updated_at
        FROM customers
        WHERE id = ?
        ''',
        (customer_id,),
    ).fetchone()
    return dict(row) if row else None


def get_customer_orders(conn, customer_id):
    order_rows = conn.execute(
        '''
        SELECT id, order_number, customer_name, customer_phone, customer_address,
               subtotal, total, delivery_note, status, payment_method, created_at,
               customer_id, points_earned, points_redeemed, discount_amount,
               coupon_id, coupon_code, coupon_discount_amount
        FROM orders
        WHERE customer_id = ?
        ORDER BY created_at DESC, id DESC
        ''',
        (customer_id,),
    ).fetchall()
    orders = []
    for row in order_rows:
        orders.append(attach_order_meta(conn, row))
    return orders


def get_customer_cart(conn, customer_id):
    rows = conn.execute(
        '''
        SELECT c.product_id, c.quantity, c.created_at, c.updated_at,
               p.name_en, p.name_zh, p.price, p.category, p.stock, p.image_url, p.badge
        FROM customer_cart_items c
        LEFT JOIN products p ON p.id = c.product_id
        WHERE c.customer_id = ?
        ORDER BY c.updated_at DESC, c.product_id ASC
        ''',
        (customer_id,),
    ).fetchall()
    items = []
    for row in rows:
        if not row['name_en']:
            continue
        items.append({
            'id': row['product_id'],
            'product_id': row['product_id'],
            'name_en': row['name_en'],
            'name_zh': row['name_zh'],
            'price': int(row['price']),
            'category': row['category'],
            'stock': int(row['stock']),
            'image_url': row['image_url'],
            'badge': row['badge'],
            'quantity': int(row['quantity']),
        })
    return items


def save_customer_cart(conn, customer_id, items):
    now = utc_now_iso()
    normalized = {}
    for raw in items or []:
        product_id = str(raw.get('product_id') or raw.get('id') or '').strip()
        quantity = max(1, int(raw.get('quantity') or raw.get('qty') or 1))
        if not product_id:
            continue
        normalized[product_id] = quantity
    conn.execute('DELETE FROM customer_cart_items WHERE customer_id = ?', (customer_id,))
    for product_id, quantity in normalized.items():
        conn.execute(
            '''
            INSERT INTO customer_cart_items(customer_id, product_id, quantity, created_at, updated_at)
            VALUES(?, ?, ?, ?, ?)
            ''',
            (customer_id, product_id, quantity, now, now),
        )
    conn.commit()
    return get_customer_cart(conn, customer_id)


def clear_customer_cart(conn, customer_id):
    conn.execute('DELETE FROM customer_cart_items WHERE customer_id = ?', (customer_id,))
    conn.commit()
    return {'ok': True}


def create_customer_session(conn, sid, customer_id, refresh_token, refresh_expires_at):
    conn.execute(
        '''
        INSERT INTO customer_sessions(sid, customer_id, refresh_hash, created_at, refresh_expires_at, revoked_at)
        VALUES(?, ?, ?, ?, ?, NULL)
        ''',
        (sid, customer_id, hash_token(refresh_token), utc_now_iso(), refresh_expires_at),
    )
    conn.commit()
    return {'ok': True}


def validate_customer_session(conn, sid):
    row = conn.execute(
        '''
        SELECT sid, customer_id, refresh_expires_at, revoked_at
        FROM customer_sessions
        WHERE sid = ?
        ''',
        (sid,),
    ).fetchone()
    if not row:
        return {'active': False}
    if row['revoked_at']:
        return {'active': False}
    if row['refresh_expires_at'] <= utc_now_iso():
        return {'active': False}
    return {'active': True, 'customer_id': row['customer_id']}


def validate_customer_refresh_session(conn, sid, refresh_token):
    row = conn.execute(
        '''
        SELECT sid, customer_id, refresh_hash, refresh_expires_at, revoked_at
        FROM customer_sessions
        WHERE sid = ?
        ''',
        (sid,),
    ).fetchone()
    if not row:
        return {'active': False}
    if row['revoked_at']:
        return {'active': False}
    if row['refresh_expires_at'] <= utc_now_iso():
        return {'active': False}
    if row['refresh_hash'] != hash_token(refresh_token):
        return {'active': False}
    return {'active': True, 'customer_id': row['customer_id']}


def revoke_customer_session(conn, sid):
    conn.execute(
        'UPDATE customer_sessions SET revoked_at = ? WHERE sid = ?',
        (utc_now_iso(), sid),
    )
    conn.commit()
    return {'ok': True}


def upsert_customer_from_google(conn, google_profile):
    google_sub = str(google_profile.get('sub') or '').strip()
    email = str(google_profile.get('email') or '').strip().lower()
    name = str(google_profile.get('name') or '').strip() or email.split('@')[0]
    avatar_url = google_profile.get('picture')
    if not google_sub or not email:
        raise ValueError('Invalid Google account data')

    existing = conn.execute(
        'SELECT * FROM customers WHERE google_sub = ? OR email = ?',
        (google_sub, email),
    ).fetchone()
    now = utc_now_iso()
    if existing:
        customer_id = existing['id']
        conn.execute(
            '''
            UPDATE customers
            SET google_sub = ?, email = ?, name = ?, avatar_url = ?, updated_at = ?
            WHERE id = ?
            ''',
            (google_sub, email, name, avatar_url, now, customer_id),
        )
    else:
        customer_id = f'cus-{uuid.uuid4()}'
        conn.execute(
            '''
            INSERT INTO customers(id, google_sub, email, name, avatar_url, phone, address, points, lifetime_spend, created_at, updated_at)
            VALUES(?, ?, ?, ?, ?, '', '', 0, 0, ?, ?)
            ''',
            (customer_id, google_sub, email, name, avatar_url, now, now),
        )
    conn.commit()
    return get_customer_by_id(conn, customer_id)


def customer_reward_summary(customer):
    points = int(customer.get('points') or 0)
    return {
        'points': points,
        'can_redeem_100': points >= 100,
        'next_reward_at': max(0, 100 - (points % 100)) if points % 100 else 100,
        'reward_value_percent': 10,
    }


def customer_payload(customer, orders):
    return {
        'customer': {
            **customer,
            'rewards': customer_reward_summary(customer),
        },
        'orders': orders,
    }


def fetch_coupons(conn):
    rows = conn.execute(
        '''
        SELECT id, code, title, description, discount_type, discount_value, min_order_amount,
               max_discount_amount, usage_limit_total, usage_limit_per_customer, start_at, end_at,
               active, first_order_only, apply_scope, target_value, stackable, times_used,
               created_at, updated_at
        FROM coupons
        ORDER BY created_at DESC, code ASC
        '''
    ).fetchall()
    coupons = rows_to_dicts(rows)
    for coupon in coupons:
        coupon['active'] = bool(coupon['active'])
        coupon['first_order_only'] = bool(coupon['first_order_only'])
        coupon['stackable'] = bool(coupon['stackable'])
    return coupons


def fetch_offers(conn, active_only=False):
    query = '''
        SELECT id, title, subtitle, tag, cta_label, href, emoji, bg_from, bg_to, accent,
               sort_order, active, start_at, end_at, created_at, updated_at
        FROM hero_offers
    '''
    params = ()
    if active_only:
        query += ' WHERE active = 1'
    query += ' ORDER BY sort_order ASC, created_at DESC'
    rows = conn.execute(query, params).fetchall()
    offers = rows_to_dicts(rows)
    for offer in offers:
        offer['active'] = bool(offer['active'])
    return offers


def seed_offers(conn, offers):
    existing = conn.execute('SELECT COUNT(*) AS c FROM hero_offers').fetchone()['c']
    if existing > 0:
        return {'seeded': False}
    now = utc_now_iso()
    inserted = []
    for index, raw in enumerate(offers or []):
        offer = {
            'id': str(raw.get('id') or f'offer-{uuid.uuid4()}'),
            'title': str(raw.get('title') or '').strip(),
            'subtitle': str(raw.get('subtitle') or '').strip(),
            'tag': str(raw.get('tag') or '').strip(),
            'cta_label': str(raw.get('cta_label') or '').strip(),
            'href': str(raw.get('href') or '/').strip() or '/',
            'emoji': str(raw.get('emoji') or '✨').strip() or '✨',
            'bg_from': str(raw.get('bg_from') or 'from-green-700').strip(),
            'bg_to': str(raw.get('bg_to') or 'to-green-900').strip(),
            'accent': str(raw.get('accent') or 'bg-white/20').strip(),
            'sort_order': int(raw.get('sort_order') or index),
            'active': 1 if raw.get('active', True) else 0,
            'start_at': raw.get('start_at'),
            'end_at': raw.get('end_at'),
        }
        if not offer['title']:
            continue
        inserted.append(offer)
        conn.execute(
            '''
            INSERT INTO hero_offers(id, title, subtitle, tag, cta_label, href, emoji, bg_from, bg_to, accent,
                                    sort_order, active, start_at, end_at, created_at, updated_at)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                offer['id'],
                offer['title'],
                offer['subtitle'],
                offer['tag'],
                offer['cta_label'],
                offer['href'],
                offer['emoji'],
                offer['bg_from'],
                offer['bg_to'],
                offer['accent'],
                offer['sort_order'],
                offer['active'],
                offer['start_at'],
                offer['end_at'],
                now,
                now,
            ),
        )
    conn.commit()
    return {'seeded': True, 'offers': inserted}


def normalize_coupon(payload, fallback_id=None):
    code = str(payload.get('code') or '').strip().upper().replace(' ', '')
    discount_type = str(payload.get('discount_type') or 'percent').strip().lower()
    apply_scope = str(payload.get('apply_scope') or 'order').strip().lower()
    target_value = str(payload.get('target_value') or '').strip()
    if apply_scope not in {'order', 'category', 'product'}:
        apply_scope = 'order'
    if discount_type not in {'percent', 'fixed', 'free_shipping'}:
        discount_type = 'percent'
    return {
        'id': str(payload.get('id') or fallback_id or uuid.uuid4()),
        'code': code,
        'title': str(payload.get('title') or '').strip(),
        'description': str(payload.get('description') or '').strip(),
        'discount_type': discount_type,
        'discount_value': max(0, int(payload.get('discount_value') or 0)),
        'min_order_amount': max(0, int(payload.get('min_order_amount') or 0)),
        'max_discount_amount': max(0, int(payload.get('max_discount_amount') or 0)),
        'usage_limit_total': max(0, int(payload.get('usage_limit_total') or 0)),
        'usage_limit_per_customer': max(0, int(payload.get('usage_limit_per_customer') or 0)),
        'start_at': payload.get('start_at') or None,
        'end_at': payload.get('end_at') or None,
        'active': 1 if payload.get('active', True) else 0,
        'first_order_only': 1 if payload.get('first_order_only') else 0,
        'apply_scope': apply_scope,
        'target_value': target_value,
        'stackable': 1 if payload.get('stackable') else 0,
    }


def get_coupon_by_code(conn, code):
    return conn.execute(
        '''
        SELECT id, code, title, description, discount_type, discount_value, min_order_amount,
               max_discount_amount, usage_limit_total, usage_limit_per_customer, start_at, end_at,
               active, first_order_only, apply_scope, target_value, stackable, times_used,
               created_at, updated_at
        FROM coupons
        WHERE code = ?
        ''',
        (str(code or '').strip().upper().replace(' ', ''),),
    ).fetchone()


def coupon_to_dict(row):
    if not row:
        return None
    data = dict(row)
    data['active'] = bool(data['active'])
    data['first_order_only'] = bool(data['first_order_only'])
    data['stackable'] = bool(data['stackable'])
    return data


def count_coupon_redemptions_for_customer(conn, coupon_id, customer_id):
    if not customer_id:
        return 0
    row = conn.execute(
        'SELECT COUNT(*) AS c FROM coupon_redemptions WHERE coupon_id = ? AND customer_id = ?',
        (coupon_id, customer_id),
    ).fetchone()
    return int(row['c'] or 0)


def validate_coupon_for_order(conn, coupon_code, customer, subtotal, line_items):
    row = conn.execute(
        '''
        SELECT id, code, title, description, discount_type, discount_value, min_order_amount,
               max_discount_amount, usage_limit_total, usage_limit_per_customer, start_at, end_at,
               active, first_order_only, apply_scope, target_value, stackable, times_used,
               created_at, updated_at
        FROM coupons
        WHERE code = ?
        ''',
        (str(coupon_code or '').strip().upper().replace(' ', ''),),
    ).fetchone()
    if not row:
        raise ValueError('Coupon code not found')
    coupon = coupon_to_dict(row)
    if not coupon['active']:
        raise ValueError('Coupon is inactive')
    now = utc_now_iso()
    if coupon['start_at'] and coupon['start_at'] > now:
        raise ValueError('Coupon is not active yet')
    if coupon['end_at'] and coupon['end_at'] < now:
        raise ValueError('Coupon has expired')
    if coupon['usage_limit_total'] and int(coupon['times_used'] or 0) >= coupon['usage_limit_total']:
        raise ValueError('Coupon usage limit reached')
    if coupon['min_order_amount'] and subtotal < int(coupon['min_order_amount']):
        raise ValueError(f"Minimum order amount is NT${int(coupon['min_order_amount']):,}")
    if coupon['first_order_only'] and customer:
        orders_count = conn.execute(
            'SELECT COUNT(*) AS c FROM orders WHERE customer_id = ?',
            (customer['id'],),
        ).fetchone()['c']
        if int(orders_count or 0) > 0:
            raise ValueError('This coupon is only for first-time customers')
    if coupon['first_order_only'] and not customer:
        raise ValueError('Please sign in to use this coupon')
    if coupon['usage_limit_per_customer'] and customer:
        used = count_coupon_redemptions_for_customer(conn, coupon['id'], customer['id'])
        if used >= coupon['usage_limit_per_customer']:
            raise ValueError('You have already used this coupon')
    if coupon['usage_limit_per_customer'] and not customer:
        raise ValueError('Please sign in to use this coupon')

    eligible_amount = subtotal
    if coupon['apply_scope'] == 'category':
        category = coupon['target_value'].strip()
        eligible_amount = sum(
            int(item['price']) * int(item['quantity'])
            for item in line_items
            if item.get('category') == category
        )
        if eligible_amount <= 0:
            raise ValueError('This coupon only applies to selected categories')
    elif coupon['apply_scope'] == 'product':
        target_ids = {part.strip() for part in coupon['target_value'].split(',') if part.strip()}
        eligible_amount = sum(
            int(item['price']) * int(item['quantity'])
            for item in line_items
            if str(item.get('product_id')) in target_ids
        )
        if eligible_amount <= 0:
            raise ValueError('This coupon only applies to selected products')

    if coupon['discount_type'] == 'percent':
        discount = round(eligible_amount * int(coupon['discount_value']) / 100)
    elif coupon['discount_type'] == 'fixed':
        discount = int(coupon['discount_value'])
    else:
        discount = 0

    if coupon['max_discount_amount']:
        discount = min(discount, int(coupon['max_discount_amount']))
    discount = min(discount, eligible_amount)
    if discount <= 0 and coupon['discount_type'] != 'free_shipping':
        raise ValueError('Coupon does not provide a discount for this order')

    return {
        'coupon': coupon,
        'discount_amount': discount,
        'eligible_amount': eligible_amount,
    }


def create_coupon(conn, payload):
    coupon = normalize_coupon(payload)
    if not coupon['code']:
        raise ValueError('Coupon code is required')
    if not coupon['title']:
        raise ValueError('Coupon title is required')
    existing = conn.execute('SELECT id FROM coupons WHERE code = ?', (coupon['code'],)).fetchone()
    if existing:
        raise ValueError('Coupon code already exists')
    now = utc_now_iso()
    conn.execute(
        '''
        INSERT INTO coupons(id, code, title, description, discount_type, discount_value, min_order_amount,
                            max_discount_amount, usage_limit_total, usage_limit_per_customer, start_at,
                            end_at, active, first_order_only, apply_scope, target_value, stackable,
                            times_used, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        ''',
        (
            coupon['id'],
            coupon['code'],
            coupon['title'],
            coupon['description'],
            coupon['discount_type'],
            coupon['discount_value'],
            coupon['min_order_amount'],
            coupon['max_discount_amount'],
            coupon['usage_limit_total'],
            coupon['usage_limit_per_customer'],
            coupon['start_at'],
            coupon['end_at'],
            coupon['active'],
            coupon['first_order_only'],
            coupon['apply_scope'],
            coupon['target_value'],
            coupon['stackable'],
            now,
            now,
        ),
    )
    record_audit_log(conn, normalize_actor(payload), 'create_coupon', 'coupon', coupon['id'], f'Created coupon {coupon["code"]}')
    conn.commit()
    return coupon_to_dict(conn.execute(
        '''
        SELECT id, code, title, description, discount_type, discount_value, min_order_amount,
               max_discount_amount, usage_limit_total, usage_limit_per_customer, start_at, end_at,
               active, first_order_only, apply_scope, target_value, stackable, times_used,
               created_at, updated_at
        FROM coupons
        WHERE id = ?
        ''',
        (coupon['id'],),
    ).fetchone())


def update_coupon(conn, payload):
    coupon_id = str(payload.get('id') or '').strip()
    row = conn.execute('SELECT * FROM coupons WHERE id = ?', (coupon_id,)).fetchone()
    if not row:
        raise ValueError('Coupon not found')
    merged = normalize_coupon({**dict(row), **payload, 'id': coupon_id}, coupon_id)
    existing = conn.execute('SELECT id FROM coupons WHERE code = ? AND id != ?', (merged['code'], coupon_id)).fetchone()
    if existing:
        raise ValueError('Coupon code already exists')
    now = utc_now_iso()
    conn.execute(
        '''
        UPDATE coupons
        SET code = ?, title = ?, description = ?, discount_type = ?, discount_value = ?,
            min_order_amount = ?, max_discount_amount = ?, usage_limit_total = ?,
            usage_limit_per_customer = ?, start_at = ?, end_at = ?, active = ?,
            first_order_only = ?, apply_scope = ?, target_value = ?, stackable = ?, updated_at = ?
        WHERE id = ?
        ''',
        (
            merged['code'],
            merged['title'],
            merged['description'],
            merged['discount_type'],
            merged['discount_value'],
            merged['min_order_amount'],
            merged['max_discount_amount'],
            merged['usage_limit_total'],
            merged['usage_limit_per_customer'],
            merged['start_at'],
            merged['end_at'],
            merged['active'],
            merged['first_order_only'],
            merged['apply_scope'],
            merged['target_value'],
            merged['stackable'],
            now,
            coupon_id,
        ),
    )
    record_audit_log(conn, normalize_actor(payload), 'update_coupon', 'coupon', coupon_id, f'Updated coupon {merged["code"]}')
    conn.commit()
    return coupon_to_dict(conn.execute(
        '''
        SELECT id, code, title, description, discount_type, discount_value, min_order_amount,
               max_discount_amount, usage_limit_total, usage_limit_per_customer, start_at, end_at,
               active, first_order_only, apply_scope, target_value, stackable, times_used,
               created_at, updated_at
        FROM coupons
        WHERE id = ?
        ''',
        (coupon_id,),
    ).fetchone())


def delete_coupon(conn, payload):
    coupon_id = str(payload.get('id') or '').strip()
    conn.execute('DELETE FROM coupons WHERE id = ?', (coupon_id,))
    record_audit_log(conn, normalize_actor(payload), 'delete_coupon', 'coupon', coupon_id, 'Deleted coupon')
    conn.commit()
    return {'ok': True}


def create_offer(conn, payload):
    offer = {
        'id': str(payload.get('id') or f'offer-{uuid.uuid4()}'),
        'title': str(payload.get('title') or '').strip(),
        'subtitle': str(payload.get('subtitle') or '').strip(),
        'tag': str(payload.get('tag') or '').strip(),
        'cta_label': str(payload.get('cta_label') or '').strip(),
        'href': str(payload.get('href') or '/').strip() or '/',
        'emoji': str(payload.get('emoji') or '✨').strip() or '✨',
        'bg_from': str(payload.get('bg_from') or 'from-green-700').strip(),
        'bg_to': str(payload.get('bg_to') or 'to-green-900').strip(),
        'accent': str(payload.get('accent') or 'bg-white/20').strip(),
        'sort_order': int(payload.get('sort_order') or 0),
        'active': 1 if payload.get('active', True) else 0,
        'start_at': payload.get('start_at') or None,
        'end_at': payload.get('end_at') or None,
    }
    if not offer['title']:
        raise ValueError('Offer title is required')
    now = utc_now_iso()
    conn.execute(
        '''
        INSERT INTO hero_offers(id, title, subtitle, tag, cta_label, href, emoji, bg_from, bg_to, accent,
                                sort_order, active, start_at, end_at, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            offer['id'],
            offer['title'],
            offer['subtitle'],
            offer['tag'],
            offer['cta_label'],
            offer['href'],
            offer['emoji'],
            offer['bg_from'],
            offer['bg_to'],
            offer['accent'],
            offer['sort_order'],
            offer['active'],
            offer['start_at'],
            offer['end_at'],
            now,
            now,
        ),
    )
    record_audit_log(conn, normalize_actor(payload), 'create_offer', 'offer', offer['id'], f'Created offer {offer["title"]}')
    conn.commit()
    return dict(conn.execute(
        '''
        SELECT id, title, subtitle, tag, cta_label, href, emoji, bg_from, bg_to, accent,
               sort_order, active, start_at, end_at, created_at, updated_at
        FROM hero_offers
        WHERE id = ?
        ''',
        (offer['id'],),
    ).fetchone())


def update_offer(conn, payload):
    offer_id = str(payload.get('id') or '').strip()
    row = conn.execute('SELECT * FROM hero_offers WHERE id = ?', (offer_id,)).fetchone()
    if not row:
        raise ValueError('Offer not found')
    merged = {
        **dict(row),
        **{k: v for k, v in payload.items() if v is not None},
    }
    if 'title' in payload and not str(payload.get('title') or '').strip():
        raise ValueError('Offer title is required')
    now = utc_now_iso()
    conn.execute(
        '''
        UPDATE hero_offers
        SET title = ?, subtitle = ?, tag = ?, cta_label = ?, href = ?, emoji = ?, bg_from = ?,
            bg_to = ?, accent = ?, sort_order = ?, active = ?, start_at = ?, end_at = ?, updated_at = ?
        WHERE id = ?
        ''',
        (
            str(merged.get('title') or '').strip(),
            str(merged.get('subtitle') or '').strip(),
            str(merged.get('tag') or '').strip(),
            str(merged.get('cta_label') or '').strip(),
            str(merged.get('href') or '/').strip() or '/',
            str(merged.get('emoji') or '✨').strip() or '✨',
            str(merged.get('bg_from') or 'from-green-700').strip(),
            str(merged.get('bg_to') or 'to-green-900').strip(),
            str(merged.get('accent') or 'bg-white/20').strip(),
            int(merged.get('sort_order') or 0),
            1 if merged.get('active') else 0,
            merged.get('start_at'),
            merged.get('end_at'),
            now,
            offer_id,
        ),
    )
    record_audit_log(conn, normalize_actor(payload), 'update_offer', 'offer', offer_id, f'Updated offer {str(merged.get("title") or "").strip()}')
    conn.commit()
    return dict(conn.execute(
        '''
        SELECT id, title, subtitle, tag, cta_label, href, emoji, bg_from, bg_to, accent,
               sort_order, active, start_at, end_at, created_at, updated_at
        FROM hero_offers
        WHERE id = ?
        ''',
        (offer_id,),
    ).fetchone())


def delete_offer(conn, payload):
    offer_id = str(payload.get('id') or '').strip()
    conn.execute('DELETE FROM hero_offers WHERE id = ?', (offer_id,))
    record_audit_log(conn, normalize_actor(payload), 'delete_offer', 'offer', offer_id, 'Deleted offer')
    conn.commit()
    return {'ok': True}


def google_verify_token(credential):
    token_info_url = f'https://oauth2.googleapis.com/tokeninfo?id_token={credential}'
    import urllib.request
    try:
        with urllib.request.urlopen(token_info_url, timeout=10) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except Exception as exc:
        raise ValueError(f'Google sign-in verification failed: {exc}')

    client_id = None
    import os
    client_id = os.environ.get('GOOGLE_OAUTH_CLIENT_ID') or os.environ.get('VITE_GOOGLE_CLIENT_ID')
    if client_id and payload.get('aud') != client_id:
        raise ValueError('Google token audience mismatch')
    if payload.get('email_verified') not in ('true', True):
        raise ValueError('Google email not verified')
    return payload


def customer_google_login(conn, credential):
    google_profile = google_verify_token(credential)
    customer = upsert_customer_from_google(conn, google_profile)
    session_id = f'csess-{uuid.uuid4()}'
    refresh_exp = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=30)
    access_exp = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=15)
    refresh_token = json.dumps({
        'sid': session_id,
        'sub': customer['google_sub'],
        'email': customer['email'],
        'type': 'refresh',
        'exp': int(refresh_exp.timestamp() * 1000),
    }, separators=(',', ':'))

    # Keep the token signed by the API layer; this string is only the payload body placeholder.
    # The HTTP server will replace it with a signed JWT-like token before storing.
    return {
        'customer': {
            **customer,
            'rewards': customer_reward_summary(customer),
        },
        'session': {
            'sid': session_id,
            'refresh_expires_at': refresh_exp.isoformat().replace('+00:00', 'Z'),
            'access_expires_at': access_exp.isoformat().replace('+00:00', 'Z'),
            'refresh_token_body': refresh_token,
        },
        'orders': get_customer_orders(conn, customer['id']),
    }


def create_order(conn, payload):
    customer_name = str(payload.get('customer_name') or '').strip()
    customer_phone = str(payload.get('customer_phone') or '').strip()
    customer_address = str(payload.get('customer_address') or '').strip()
    payment_method = str(payload.get('payment_method') or 'paytm').strip()
    customer_id = str(payload.get('customer_id') or '').strip() or None
    redeem_points = int(payload.get('redeem_points') or 0)
    coupon_code = str(payload.get('coupon_code') or '').strip().upper().replace(' ', '')
    raw_items = payload.get('items') or []
    actor = normalize_actor(payload)

    if not raw_items:
        raise ValueError('Cart is empty')

    conn.execute('BEGIN IMMEDIATE')
    try:
        customer = None
        if customer_id:
            customer = get_customer_by_id(conn, customer_id)
            if not customer:
                raise ValueError('Customer account not found')
            if not customer_name:
                customer_name = customer['name']
            if not customer_phone:
                customer_phone = customer['phone']
            if not customer_address:
                customer_address = customer['address']

        if not customer_name:
            raise ValueError('Customer name is required')
        if not customer_phone:
            raise ValueError('Customer phone is required')
        if not customer_address:
            raise ValueError('Customer address is required')

        line_items = []
        subtotal = 0

        for raw_item in raw_items:
            product_id = str(raw_item.get('product_id') or raw_item.get('id') or '')
            quantity = max(1, int(raw_item.get('quantity') or raw_item.get('qty') or 1))
            product = conn.execute(
                '''
                SELECT id, name_en, category, price, stock
                FROM products
                WHERE id = ?
                ''',
                (product_id,),
            ).fetchone()
            if not product:
                raise ValueError(f'Product {product_id} was not found')
            if int(product['stock']) < quantity:
                raise ValueError(f'Not enough stock for {product["name_en"]}')

            line_items.append({
                'product_id': str(product['id']),
                'name': str(product['name_en']),
                'category': str(product['category']),
                'price': int(product['price']),
                'quantity': quantity,
            })
            subtotal += int(product['price']) * quantity

        if redeem_points not in {0, 100}:
            raise ValueError('Loyalty redemption must be 100 points')
        if redeem_points and not customer_id:
            raise ValueError('Sign in to redeem loyalty points')

        coupon_result = None
        coupon_discount_amount = 0
        coupon_id = None
        if coupon_code:
            coupon_result = validate_coupon_for_order(conn, coupon_code, customer, subtotal, line_items)
            coupon_discount_amount = int(coupon_result['discount_amount'])
            coupon_id = coupon_result['coupon']['id']
            if redeem_points and not coupon_result['coupon']['stackable']:
                raise ValueError('This coupon cannot be combined with loyalty rewards')

        discount_amount = 0
        points_earned = 0
        if customer_id and redeem_points:
            if int(customer['points']) < redeem_points:
                raise ValueError('Not enough loyalty points to redeem')
            eligible_total = max(0, subtotal - coupon_discount_amount)
            discount_amount = max(0, int(round(eligible_total * 0.10)))

        total = max(0, subtotal - coupon_discount_amount - discount_amount)
        points_earned = max(0, total // 10)

        next_number = next_order_number(conn)
        order_number = f'#{next_number:03d}'
        order_id = f'ord-{uuid.uuid4()}'
        created_at = utc_now_iso()

        conn.execute(
            '''
            INSERT INTO orders(id, order_number, customer_id, customer_name, customer_phone, customer_address,
                               subtotal, total, delivery_note, status, payment_method, created_at,
                               points_earned, points_redeemed, discount_amount, coupon_id, coupon_code, coupon_discount_amount)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                order_id,
                order_number,
                customer_id,
                customer_name,
                customer_phone,
                customer_address,
                subtotal,
                total,
                'Free delivery in Taiwan',
                'pending',
                payment_method,
                created_at,
                points_earned,
                redeem_points,
                discount_amount,
                coupon_id,
                coupon_code,
                coupon_discount_amount,
            ),
        )

        record_order_event(conn, order_id, 'pending', 'Order placed', actor)

        for sort_order, item in enumerate(line_items):
            conn.execute(
                '''
                INSERT INTO order_items(order_id, product_id, name, price, quantity, sort_order)
                VALUES(?, ?, ?, ?, ?, ?)
                ''',
                (order_id, item['product_id'], item['name'], item['price'], item['quantity'], sort_order),
            )
            conn.execute(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                (item['quantity'], item['product_id']),
            )

        if customer_id:
            conn.execute(
                '''
                UPDATE customers
                SET points = points - ? + ?, lifetime_spend = lifetime_spend + ?, updated_at = ?
                WHERE id = ?
                ''',
                (redeem_points, points_earned, total, created_at, customer_id),
            )
            conn.execute('DELETE FROM customer_cart_items WHERE customer_id = ?', (customer_id,))
            if coupon_id:
                conn.execute('UPDATE coupons SET times_used = times_used + 1, updated_at = ? WHERE id = ?', (created_at, coupon_id))
                conn.execute(
                    '''
                    INSERT INTO coupon_redemptions(coupon_id, coupon_code, order_id, customer_id, discount_amount, created_at)
                    VALUES(?, ?, ?, ?, ?, ?)
                    ''',
                    (coupon_id, coupon_code, order_id, customer_id, coupon_discount_amount, created_at),
                )
            if redeem_points:
                conn.execute(
                    '''
                    INSERT INTO customer_point_transactions(customer_id, order_id, type, points, note, created_at)
                    VALUES(?, ?, 'redeem', ?, ?, ?)
                    ''',
                    (customer_id, order_id, redeem_points, 'Redeemed loyalty points', created_at),
                )
            if points_earned:
                conn.execute(
                    '''
                    INSERT INTO customer_point_transactions(customer_id, order_id, type, points, note, created_at)
                    VALUES(?, ?, 'earn', ?, ?, ?)
                    ''',
                    (customer_id, order_id, points_earned, 'Earned from completed order', created_at),
                )

        if actor:
            record_audit_log(
                conn,
                actor,
                'create_order',
                'order',
                order_id,
                f'Created order {order_number} for {customer_name}',
            )

        set_meta(conn, 'next_order_number', next_number + 1)
        conn.commit()
        return get_order(conn, order_id)
    except Exception:
        conn.rollback()
        raise


def get_order(conn, order_id):
    order = conn.execute(
        '''
        SELECT id, order_number, customer_id, customer_name, customer_phone, customer_address,
               subtotal, total, delivery_note, status, payment_method, created_at,
               points_earned, points_redeemed, discount_amount, coupon_id, coupon_code, coupon_discount_amount
        FROM orders
        WHERE id = ?
        ''',
        (order_id,),
    ).fetchone()
    if not order:
        return None
    result = dict(order)
    result['items'] = rows_to_dicts(
        conn.execute(
            '''
            SELECT product_id, name, price, quantity
            FROM order_items
            WHERE order_id = ?
            ORDER BY sort_order ASC, id ASC
            ''',
            (order_id,),
        ).fetchall()
    )
    result['events'] = fetch_order_events(conn, order_id)
    return result


def update_order_status(conn, payload):
    order_id = str(payload.get('id') or '').strip()
    status = str(payload.get('status') or '').strip()
    actor = normalize_actor(payload)
    order = conn.execute(
        'SELECT id, order_number, status, customer_id, points_earned, points_redeemed FROM orders WHERE id = ?',
        (order_id,),
    ).fetchone()
    if not order:
        raise ValueError('Order not found')
    if status not in {'pending', 'confirmed', 'packed', 'shipped', 'fulfilled', 'cancelled'}:
        raise ValueError('Invalid order status')
    if order['status'] == status:
        return get_order(conn, order_id)

    items = conn.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        (order_id,),
    ).fetchall()

    conn.execute('BEGIN IMMEDIATE')
    try:
        if order['status'] != 'cancelled' and status == 'cancelled':
            for item in items:
                conn.execute(
                    'UPDATE products SET stock = stock + ? WHERE id = ?',
                    (int(item['quantity']), item['product_id']),
                )
            if order['customer_id']:
                conn.execute(
                    '''
                    UPDATE customers
                    SET points = MAX(0, points + ? - ?), updated_at = ?
                    WHERE id = ?
                    ''',
                    (int(order['points_redeemed'] or 0), int(order['points_earned'] or 0), utc_now_iso(), order['customer_id']),
                )
        elif order['status'] == 'cancelled' and status != 'cancelled':
            for item in items:
                product = conn.execute(
                    'SELECT stock, name_en FROM products WHERE id = ?',
                    (item['product_id'],),
                ).fetchone()
                if not product:
                    raise ValueError(f'Product {item["product_id"]} was not found')
                if int(product['stock']) < int(item['quantity']):
                    raise ValueError(f'Not enough stock for {product["name_en"]}')
                conn.execute(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    (int(item['quantity']), item['product_id']),
                )
            if order['customer_id']:
                conn.execute(
                    '''
                    UPDATE customers
                    SET points = MAX(0, points - ? + ?), updated_at = ?
                    WHERE id = ?
                    ''',
                    (int(order['points_redeemed'] or 0), int(order['points_earned'] or 0), utc_now_iso(), order['customer_id']),
                )

        conn.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
        record_order_event(
            conn,
            order_id,
            status,
            {
                'pending': 'Order placed',
                'confirmed': 'Order confirmed by owner',
                'packed': 'Order packed and ready',
                'shipped': 'Out for delivery',
                'fulfilled': 'Order delivered',
                'cancelled': 'Order cancelled',
            }[status],
            actor,
        )
        record_audit_log(
            conn,
            actor,
            'update_order_status',
            'order',
            order_id,
            f'Updated order {order["order_number"]} to {status}',
        )
        conn.commit()
        return get_order(conn, order_id)
    except Exception:
        conn.rollback()
        raise


def normalize_product(product, fallback_id=None):
    name_en = str(product.get('name_en') or '').strip()
    category = str(product.get('category') or 'spices').strip() or 'spices'
    search_hint = ''
    if category == 'dal-pulses' or any(term in name_en.lower() for term in ['chana dal', 'chick peas', 'kabuli chana', 'rajma', 'moong dal', 'masoor dal', 'toor dal']):
        search_hint = ' Search for chana dal near me in Taiwan, and you will find trusted Indian grocery delivery from MIK Store.'
    seo_slug = str(product.get('seo_slug') or '').strip().lower()
    if not seo_slug:
        seo_slug = slugify(name_en) or str(fallback_id or uuid.uuid4())
    seo_h1 = str(product.get('seo_h1') or '').strip() or name_en
    seo_title = str(product.get('seo_title') or '').strip() or f'{name_en} in Taiwan | MIK Store'
    seo_description = str(product.get('seo_description') or '').strip() or (
        f'Buy {name_en} online in Taiwan from MIK Store. Fast delivery, authentic Indian grocery, and trusted service for Indian cooking needs.'
    )
    seo_keywords = str(product.get('seo_keywords') or '').strip() or ', '.join(filter(None, [
        name_en,
        category.replace('-', ' '),
        'Indian grocery Taiwan',
        'Taiwan Indian groceries',
    ]))
    seo_content = str(product.get('seo_content') or '').strip() or (
        f'{name_en} is available across Taiwan with quick delivery and trusted Indian grocery support. '
        f'Ideal for home cooking, pantry stocking, and repeat orders from customers searching for Indian groceries near them in Taiwan.{search_hint}'
    )
    image_url = str(product.get('image_url') or '').strip() or None
    if image_url and not image_url.startswith('/'):
        raise ValueError('Product image must use a local path beginning with /')
    return {
        'id': str(product.get('id') or fallback_id or uuid.uuid4()),
        'name_en': name_en,
        'name_zh': str(product.get('name_zh') or '').strip(),
        'seo_slug': seo_slug,
        'seo_title': seo_title,
        'seo_description': seo_description,
        'seo_keywords': seo_keywords,
        'seo_h1': seo_h1,
        'seo_content': seo_content,
        'price': int(product.get('price') or 0),
        'category': category,
        'stock': int(product.get('stock') or 0),
        'image_url': image_url,
        'badge': product.get('badge'),
        'created_at': str(product.get('created_at') or utc_now_iso()),
    }


def create_product(conn, payload):
    product = normalize_product(payload)
    if not product['name_en']:
        raise ValueError('Product name is required')
    conn.execute(
        '''
        INSERT INTO products(id, name_en, name_zh, seo_slug, seo_title, seo_description, seo_keywords, seo_h1, seo_content,
                             price, category, stock, image_url, badge, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            product['id'],
            product['name_en'],
            product['name_zh'],
            product['seo_slug'],
            product['seo_title'],
            product['seo_description'],
            product['seo_keywords'],
            product['seo_h1'],
            product['seo_content'],
            product['price'],
            product['category'],
            product['stock'],
            product['image_url'],
            product['badge'],
            product['created_at'],
        ),
    )
    record_audit_log(conn, normalize_actor(payload), 'create_product', 'product', product['id'], f'Created product {product["name_en"]}')
    conn.commit()
    return product


def update_product(conn, payload):
    product_id = str(payload.get('id') or '').strip()
    updates = payload.get('updates') or {}
    row = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not row:
        raise ValueError('Product not found')
    merged = normalize_product({**dict(row), **updates, 'id': product_id}, product_id)
    conn.execute(
        '''
        UPDATE products
        SET name_en = ?, name_zh = ?, seo_slug = ?, seo_title = ?, seo_description = ?, seo_keywords = ?,
            seo_h1 = ?, seo_content = ?, price = ?, category = ?, stock = ?, image_url = ?, badge = ?
        WHERE id = ?
        ''',
        (
            merged['name_en'],
            merged['name_zh'],
            merged['seo_slug'],
            merged['seo_title'],
            merged['seo_description'],
            merged['seo_keywords'],
            merged['seo_h1'],
            merged['seo_content'],
            merged['price'],
            merged['category'],
            merged['stock'],
            merged['image_url'],
            merged['badge'],
            product_id,
        ),
    )
    record_audit_log(conn, normalize_actor(payload), 'update_product', 'product', product_id, f'Updated product {merged["name_en"]}')
    conn.commit()
    return merged


def delete_product(conn, payload):
    product_id = str(payload.get('id') or '').strip()
    conn.execute('DELETE FROM products WHERE id = ?', (product_id,))
    record_audit_log(conn, normalize_actor(payload), 'delete_product', 'product', product_id, 'Deleted product')
    conn.commit()
    return {'ok': True}


def import_products(conn, payload):
    incoming = payload.get('products') or []
    existing = {
        str(row['name_en']).lower()
        for row in conn.execute('SELECT name_en FROM products').fetchall()
    }
    imported = []
    for raw in incoming:
        product = normalize_product(raw, uuid.uuid4())
        if not product['name_en']:
            continue
        key = product['name_en'].lower()
        if key in existing:
            continue
        existing.add(key)
        imported.append(product)
        conn.execute(
            '''
            INSERT INTO products(id, name_en, name_zh, seo_slug, seo_title, seo_description, seo_keywords, seo_h1, seo_content,
                                 price, category, stock, image_url, badge, created_at)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                product['id'],
                product['name_en'],
                product['name_zh'],
                product['seo_slug'],
                product['seo_title'],
                product['seo_description'],
                product['seo_keywords'],
                product['seo_h1'],
                product['seo_content'],
                product['price'],
                product['category'],
                product['stock'],
                product['image_url'],
                product['badge'],
                product['created_at'],
            ),
        )
    conn.commit()
    if imported:
        record_audit_log(conn, normalize_actor(payload), 'import_products', 'product', '', f'Imported {len(imported)} products')
        conn.commit()
    return imported


def update_customer_profile(conn, payload):
    customer_id = str(payload.get('customer_id') or '').strip()
    updates = payload.get('updates') or {}
    customer = get_customer_by_id(conn, customer_id)
    if not customer:
        raise ValueError('Customer account not found')

    name = str(updates.get('name') or customer['name']).strip()
    phone = str(updates.get('phone') or customer['phone']).strip()
    address = str(updates.get('address') or customer['address']).strip()
    avatar_url = updates.get('avatar_url', customer.get('avatar_url'))
    now = utc_now_iso()

    conn.execute(
        '''
        UPDATE customers
        SET name = ?, phone = ?, address = ?, avatar_url = ?, updated_at = ?
        WHERE id = ?
        ''',
        (name, phone, address, avatar_url, now, customer_id),
    )
    record_audit_log(conn, normalize_actor(payload), 'update_customer_profile', 'customer', customer_id, f'Updated profile for {name}')
    conn.commit()
    return get_customer_by_id(conn, customer_id)


def list_admin_audit_logs(conn, limit=25):
    rows = conn.execute(
        '''
        SELECT id, actor_type, actor_id, action, entity_type, entity_id, summary, created_at
        FROM admin_audit_logs
        ORDER BY created_at DESC, id DESC
        LIMIT ?
        ''',
        (int(limit) or 25,),
    ).fetchall()
    return rows_to_dicts(rows)


def admin_analytics(conn):
    today = utc_now_iso()[:10]
    total_orders = int(conn.execute('SELECT COUNT(*) AS c FROM orders').fetchone()['c'] or 0)
    total_revenue = int(conn.execute('SELECT COALESCE(SUM(total), 0) AS s FROM orders').fetchone()['s'] or 0)
    revenue_today = int(
        conn.execute(
            'SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE created_at LIKE ?',
            (f'{today}%',),
        ).fetchone()['s'] or 0
    )
    average_order_value = round(total_revenue / total_orders, 2) if total_orders else 0
    customer_rows = conn.execute(
        'SELECT customer_id, COUNT(*) AS order_count FROM orders WHERE customer_id IS NOT NULL GROUP BY customer_id'
    ).fetchall()
    unique_customers = len(customer_rows)
    repeat_customers = sum(1 for row in customer_rows if int(row['order_count'] or 0) >= 2)
    returning_rate = round((repeat_customers / unique_customers) * 100, 1) if unique_customers else 0
    low_stock = int(conn.execute('SELECT COUNT(*) AS c FROM products WHERE stock > 0 AND stock <= 10').fetchone()['c'] or 0)
    out_of_stock = int(conn.execute('SELECT COUNT(*) AS c FROM products WHERE stock <= 0').fetchone()['c'] or 0)
    coupon_redemptions = int(conn.execute('SELECT COUNT(*) AS c FROM coupon_redemptions').fetchone()['c'] or 0)
    top_coupon_row = conn.execute(
        '''
        SELECT coupon_code, COUNT(*) AS uses, COALESCE(SUM(discount_amount), 0) AS saved
        FROM coupon_redemptions
        GROUP BY coupon_code
        ORDER BY uses DESC, saved DESC
        LIMIT 1
        '''
    ).fetchone()
    top_products = rows_to_dicts(
        conn.execute(
            '''
            SELECT p.id, p.name_en, COALESCE(SUM(oi.quantity), 0) AS units_sold, COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            GROUP BY p.id, p.name_en
            ORDER BY units_sold DESC, revenue DESC
            LIMIT 5
            '''
        ).fetchall()
    )
    recent_audit_logs = list_admin_audit_logs(conn, 10)
    return {
        'kpis': {
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'revenue_today': revenue_today,
            'average_order_value': average_order_value,
            'unique_customers': unique_customers,
            'repeat_customers': repeat_customers,
            'returning_rate': returning_rate,
            'coupon_redemptions': coupon_redemptions,
            'low_stock': low_stock,
            'out_of_stock': out_of_stock,
        },
        'top_coupon': dict(top_coupon_row) if top_coupon_row else None,
        'top_products': top_products,
        'recent_audit_logs': recent_audit_logs,
    }


def main():
    try:
      raw = sys.stdin.read()
      payload = json.loads(raw) if raw.strip() else {}
      action = payload.get('action')
      data = payload.get('payload') or {}

      conn = connect()
      ensure_schema(conn)

      if action == 'seed':
          result = seed_database(conn, data.get('seed') or {})
      elif action == 'seed_offers':
          result = seed_offers(conn, data.get('offers') or [])
      elif action == 'bootstrap':
          result = {
              'products': fetch_products(conn),
              'orders': fetch_orders(conn),
              'offers': fetch_offers(conn),
          }
      elif action == 'list_products':
          result = fetch_products(conn)
      elif action == 'list_orders':
          result = fetch_orders(conn)
      elif action == 'list_offers':
          result = fetch_offers(conn)
      elif action == 'list_coupons':
          result = fetch_coupons(conn)
      elif action == 'verify_admin':
          result = verify_admin(conn, str(data.get('email') or '').strip().lower(), str(data.get('password') or ''))
      elif action == 'create_session':
          result = create_session(
              conn,
              str(data.get('sid') or ''),
              str(data.get('admin_email') or '').strip().lower(),
              str(data.get('refresh_token') or ''),
              str(data.get('refresh_expires_at') or utc_now_iso()),
          )
      elif action == 'validate_session':
          result = validate_session(conn, str(data.get('sid') or ''))
      elif action == 'validate_refresh_session':
          result = validate_refresh_session(
              conn,
              str(data.get('sid') or ''),
              str(data.get('refresh_token') or ''),
          )
      elif action == 'revoke_session':
          result = revoke_session(conn, str(data.get('sid') or ''))
      elif action == 'create_customer_session':
          result = create_customer_session(
              conn,
              str(data.get('sid') or ''),
              str(data.get('customer_id') or ''),
              str(data.get('refresh_token') or ''),
              str(data.get('refresh_expires_at') or utc_now_iso()),
          )
      elif action == 'validate_customer_session':
          result = validate_customer_session(conn, str(data.get('sid') or ''))
      elif action == 'validate_customer_refresh_session':
          result = validate_customer_refresh_session(
              conn,
              str(data.get('sid') or ''),
              str(data.get('refresh_token') or ''),
          )
      elif action == 'revoke_customer_session':
          result = revoke_customer_session(conn, str(data.get('sid') or ''))
      elif action == 'save_wix_session':
          result = save_wix_session(
              conn,
              str(data.get('sid') or ''),
              str(data.get('kind') or ''),
              str(data.get('payload') or ''),
              str(data.get('expires_at') or utc_now_iso()),
          )
      elif action == 'get_wix_session':
          result = get_wix_session(
              conn,
              str(data.get('sid') or ''),
              str(data.get('kind') or ''),
          )
      elif action == 'delete_wix_session':
          result = delete_wix_session(conn, str(data.get('sid') or ''))
      elif action == 'create_order':
          result = create_order(conn, data)
      elif action == 'update_order_status':
          result = update_order_status(conn, data)
      elif action == 'create_product':
          result = create_product(conn, data)
      elif action == 'update_product':
          result = update_product(conn, data)
      elif action == 'delete_product':
          result = delete_product(conn, data)
      elif action == 'import_products':
          result = import_products(conn, data)
      elif action == 'create_coupon':
          result = create_coupon(conn, data)
      elif action == 'update_coupon':
          result = update_coupon(conn, data)
      elif action == 'delete_coupon':
          result = delete_coupon(conn, data)
      elif action == 'create_offer':
          result = create_offer(conn, data)
      elif action == 'update_offer':
          result = update_offer(conn, data)
      elif action == 'delete_offer':
          result = delete_offer(conn, data)
      elif action == 'get_customer_cart':
          result = get_customer_cart(conn, str(data.get('customer_id') or ''))
      elif action == 'save_customer_cart':
          result = save_customer_cart(conn, str(data.get('customer_id') or ''), data.get('items') or [])
      elif action == 'clear_customer_cart':
          result = clear_customer_cart(conn, str(data.get('customer_id') or ''))
      elif action == 'list_admin_audit_logs':
          result = list_admin_audit_logs(conn, int(data.get('limit') or 25))
      elif action == 'admin_analytics':
          result = admin_analytics(conn)
      elif action == 'get_customer':
          customer = get_customer_by_id(conn, str(data.get('customer_id') or ''))
          if not customer:
              raise ValueError('Customer account not found')
          result = customer
      elif action == 'get_customer_orders':
          result = get_customer_orders(conn, str(data.get('customer_id') or ''))
      elif action == 'update_customer_profile':
          result = update_customer_profile(conn, data)
      elif action == 'upsert_customer_from_google':
          result = upsert_customer_from_google(conn, data.get('google_profile') or {})
      else:
          raise ValueError(f'Unknown action: {action}')

      print(json.dumps({'ok': True, 'result': result}, ensure_ascii=False))
    except Exception as exc:
      print(json.dumps({'ok': False, 'error': str(exc)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
