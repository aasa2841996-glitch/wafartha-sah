import os
import json
import base64
import uuid
import requests

from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ConversationHandler,
    ContextTypes,
    filters,
)

# =========================================================
# SETTINGS
# =========================================================

BOT_TOKEN = os.environ.get("BOT_TOKEN")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_REPO = os.environ.get("GITHUB_REPO", "aasa2841996-glitch/wafartha-sah")
ADMIN_ID = os.environ.get("ADMIN_ID")

PRODUCTS_FILE = "products.json"


# =========================================================
# CATEGORIES
# =========================================================

CATEGORIES = {
    "👟 الأحذية": "shoes",
    "👗 الفساتين": "dresses",
    "💍 الإكسسوارات": "accessories",
    "👜 الشنط": "bags",
    "⌚ الساعات": "watches",
    "📱 الإلكترونيات": "electronics",
    "🏠 المنزل": "home",
    "🔥 أقوى العروض": "deals",
}


# =========================================================
# STATES
# =========================================================

PHOTO, TITLE, PRICE, OLD_PRICE, LINK, CATEGORY = range(6)


# =========================================================
# SECURITY
# =========================================================

def is_admin(update: Update) -> bool:

    if not ADMIN_ID:
        return False

    user = update.effective_user

    if not user:
        return False

    return str(user.id) == str(ADMIN_ID)


# =========================================================
# GITHUB HELPERS
# =========================================================

def github_headers():

    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def github_url(path):

    return f"https://api.github.com/repos/{GITHUB_REPO}/contents/{path}"


def github_get(path):

    response = requests.get(
        github_url(path),
        headers=github_headers(),
        timeout=30,
    )

    if response.status_code == 200:
        return response.json()

    if response.status_code == 404:
        return None

    response.raise_for_status()


def github_upload(path, content_bytes, message):

    existing = github_get(path)

    encoded = base64.b64encode(content_bytes).decode("utf-8")

    data = {
        "message": message,
        "content": encoded,
        "branch": "main",
    }

    if existing:
        data["sha"] = existing["sha"]

    response = requests.put(
        github_url(path),
        headers=github_headers(),
        json=data,
        timeout=60,
    )

    response.raise_for_status()

    return response.json()


def github_download(path):

    existing = github_get(path)

    if not existing:
        return None

    content = existing.get("content", "")

    content = content.replace("\n", "")

    return base64.b64decode(content)


# =========================================================
# PRODUCTS DATABASE
# =========================================================

def default_products():

    return {
        "bags": [],
        "shoes": [],
        "dresses": [],
        "accessories": [],
        "watches": [],
        "electronics": [],
        "home": [],
        "deals": [],
    }


def load_products():

    try:

        raw = github_download(PRODUCTS_FILE)

        if not raw:
            return default_products()

        return json.loads(raw.decode("utf-8"))

    except Exception:

        return default_products()


def save_products(products):

    content = json.dumps(
        products,
        ensure_ascii=False,
        indent=2,
    ).encode("utf-8")

    github_upload(
        PRODUCTS_FILE,
        content,
        "Update products",
    )


# =========================================================
# START
# =========================================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):

    if not is_admin(update):

        await update.message.reply_text(
            "⛔ هذا البوت مخصص لإدارة متجر وَفِّرْهَا صَحّ."
        )

        return ConversationHandler.END


    keyboard = [
        ["➕ إضافة منتج"],
    ]

    await update.message.reply_text(
        "🔥 أهلاً بك في لوحة إدارة وَفِّرْهَا صَحّ\n\n"
        "من هنا تستطيع إضافة المنتجات إلى المتجر بدون تعديل الكود.",
        reply_markup=ReplyKeyboardMarkup(
            keyboard,
            resize_keyboard=True,
        ),
    )


# =========================================================
# ADD PRODUCT
# =========================================================

async def add_product(update: Update, context: ContextTypes.DEFAULT_TYPE):

    if not is_admin(update):
        return ConversationHandler.END


    context.user_data.clear()


    await update.message.reply_text(
        "📸 أرسل صورة المنتج الآن."
    )

    return PHOTO


# =========================================================
# PHOTO
# =========================================================

async def receive_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):

    if not is_admin(update):
        return ConversationHandler.END


    if not update.message.photo:

        await update.message.reply_text(
            "⚠️ أرسل صورة للمنتج."
        )

        return PHOTO


    photo = update.message.photo[-1]

    context.user_data["file_id"] = photo.file_id


    await update.message.reply_text(
        "✅ تم استلام الصورة.\n\n"
        "📝 الآن أرسل اسم المنتج."
    )

    return TITLE


# =========================================================
# TITLE
# =========================================================

async def receive_title(update: Update, context: ContextTypes.DEFAULT_TYPE):

    context.user_data["title"] = update.message.text.strip()


    await update.message.reply_text(
        "💰 أرسل السعر الحالي بالريال.\n\n"
        "مثال:\n"
        "53.28"
    )

    return PRICE


# =========================================================
# PRICE
# =========================================================

async def receive_price(update: Update, context: ContextTypes.DEFAULT_TYPE):

    price = update.message.text.strip()

    try:
        float(price)
    except ValueError:

        await update.message.reply_text(
            "⚠️ السعر غير صحيح.\n"
            "أرسل رقمًا مثل:\n"
            "53.28"
        )

        return PRICE


    context.user_data["price"] = price


    await update.message.reply_text(
        "💵 أرسل السعر القديم.\n\n"
        "مثال:\n"
        "261.99"
    )

    return OLD_PRICE


# =========================================================
# OLD PRICE
# =========================================================

async def receive_old_price(update: Update, context: ContextTypes.DEFAULT_TYPE):

    old_price = update.message.text.strip()

    try:
        float(old_price)
    except ValueError:

        await update.message.reply_text(
            "⚠️ السعر غير صحيح.\n"
            "أرسل رقمًا مثل:\n"
            "261.99"
        )

        return OLD_PRICE


    context.user_data["old"] = old_price


    await update.message.reply_text(
        "🔗 أرسل رابط المنتج.\n\n"
        "مثال:\n"
        "رابط Temu أو Amazon أو Noon"
    )

    return LINK


# =========================================================
# LINK
# =========================================================

async def receive_link(update: Update, context: ContextTypes.DEFAULT_TYPE):

    link = update.message.text.strip()

    if not (
        link.startswith("http://")
        or link.startswith("https://")
    ):

        await update.message.reply_text(
            "⚠️ الرابط غير صحيح.\n"
            "أرسل الرابط كاملًا ويجب أن يبدأ بـ https://"
        )

        return LINK


    context.user_data["link"] = link


    keyboard = [
        ["👟 الأحذية", "👗 الفساتين"],
        ["💍 الإكسسوارات", "👜 الشنط"],
        ["⌚ الساعات", "📱 الإلكترونيات"],
        ["🏠 المنزل", "🔥 أقوى العروض"],
    ]


    await update.message.reply_text(
        "📂 اختر القسم الذي تريد وضع المنتج فيه:",
        reply_markup=ReplyKeyboardMarkup(
            keyboard,
            resize_keyboard=True,
            one_time_keyboard=True,
        ),
    )

    return CATEGORY


# =========================================================
# CATEGORY
# =========================================================

async def receive_category(update: Update, context: ContextTypes.DEFAULT_TYPE):

    category_name = update.message.text.strip()

    if category_name not in CATEGORIES:

        await update.message.reply_text(
            "⚠️ اختر أحد الأقسام الموجودة في القائمة."
        )

        return CATEGORY


    category = CATEGORIES[category_name]

    context.user_data["category"] = category


    await update.message.reply_text(
        "⏳ جاري إضافة المنتج إلى المتجر..."
    )


    try:

        # -------------------------------------------------
        # DOWNLOAD TELEGRAM IMAGE
        # -------------------------------------------------

        file_id = context.user_data["file_id"]

        telegram_file = await context.bot.get_file(file_id)

        image_bytes = bytes(
            await telegram_file.download_as_bytearray()
        )


        # -------------------------------------------------
        # UNIQUE IMAGE NAME
        # -------------------------------------------------

        image_name = (
            f"product-{uuid.uuid4().hex[:12]}.jpg"
        )

        image_path = f"products/{image_name}"


        # -------------------------------------------------
        # UPLOAD IMAGE TO GITHUB
        # -------------------------------------------------

        github_upload(
            image_path,
            image_bytes,
            "Add product image",
        )


        # -------------------------------------------------
        # PRODUCT DATA
        # -------------------------------------------------

        product = {

            "id": uuid.uuid4().hex,

            "title": context.user_data["title"],

            "price": context.user_data["price"],

            "old": context.user_data["old"],

            "image": image_path,

            "link": context.user_data["link"],

        }


        # -------------------------------------------------
        # SAVE PRODUCT
        # -------------------------------------------------

        products = load_products()


        if category not in products:
            products[category] = []


        products[category].insert(
            0,
            product,
        )


        save_products(products)


        await update.message.reply_text(

            "✅ تم إضافة المنتج بنجاح!\n\n"

            f"🛍️ {product['title']}\n"
            f"💰 السعر: {product['price']} ر.س\n"
            f"💵 القديم: {product['old']} ر.س\n"
            f"📂 القسم: {category_name}\n\n"

            "🔥 المنتج محفوظ الآن في المتجر."

        )


        context.user_data.clear()


        return ConversationHandler.END


    except Exception as error:

        print("ERROR:", error)

        await update.message.reply_text(

            "❌ حدث خطأ أثناء إضافة المنتج.\n\n"

            "تأكد من إعداد صلاحيات GitHub بشكل صحيح."

        )

        return ConversationHandler.END


# =========================================================
# CANCEL
# =========================================================

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):

    context.user_data.clear()


    await update.message.reply_text(
        "❌ تم إلغاء إضافة المنتج."
    )


    return ConversationHandler.END


# =========================================================
# MAIN
# =========================================================

def main():

    if not BOT_TOKEN:

        raise RuntimeError(
            "BOT_TOKEN is missing"
        )


    if not GITHUB_TOKEN:

        raise RuntimeError(
            "GITHUB_TOKEN is missing"
        )


    application = (
        Application.builder()
        .token(BOT_TOKEN)
        .build()
    )


    conversation = ConversationHandler(

        entry_points=[

            MessageHandler(
                filters.Regex("^➕ إضافة منتج$"),
                add_product,
            )

        ],

        states={

            PHOTO: [
                MessageHandler(
                    filters.PHOTO,
                    receive_photo,
                )
            ],

            TITLE: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND,
                    receive_title,
                )
            ],

            PRICE: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND,
                    receive_price,
                )
            ],

            OLD_PRICE: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND,
                    receive_old_price,
                )
            ],

            LINK: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND,
                    receive_link,
                )
            ],

            CATEGORY: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND,
                    receive_category,
                )
            ],

        },

        fallbacks=[

            CommandHandler(
                "cancel",
                cancel,
            )

        ],

    )


    application.add_handler(
        CommandHandler(
            "start",
            start,
        )
    )


    application.add_handler(
        conversation
    )


    print("🔥 Wafartha Sah Admin Bot is running...")


    application.run_polling()


if __name__ == "__main__":
    main()
