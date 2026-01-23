"use client";

import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { useLocale } from "next-intl";
import type { Order, OrderItem, Customer } from "@/lib/services/orders";

export interface ShippingLabelProps {
  order: Order;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

// Helper to extract name from a value that could be a string or an object with name properties
function extractName(value: unknown, locale: string): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    // Try locale-specific name first, then fallback
    if (locale === "ar" && obj.name_ar) return String(obj.name_ar);
    if (obj.name_en) return String(obj.name_en);
    if (obj.name) return String(obj.name);
  }
  return null;
}

export function ShippingLabel({ order, t, tCommon }: ShippingLabelProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";

  const customer: Customer = order.customer || {
    name: "",
    mobile: "",
    address: "",
  };

  // Extract city and governorate names (handle both string and object formats)
  const cityName = extractName(customer.city, locale);
  const governorateName = extractName(customer.governorate, locale);

  // Extract vendor name
  const vendorName = extractName(order.vendor, locale);

  const items: OrderItem[] = order.items || [];
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const isCOD = order.payment_method === "cash";

  return (
    <div
      className="shipping-label bg-white text-black"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        width: "200mm",
        height: "140mm",
        padding: "5mm",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Header: Logo + Vendor + QR Code */}
      <div
        className="flex items-start justify-between border-b-2 border-black pb-2 mb-2"
        style={{ borderBottomWidth: "2px" }}
      >
        <div className="flex flex-col gap-1">
          <Image
            src="/rahwan-logo-light.png"
            alt="Rahwan"
            width={120}
            height={45}
            style={{ objectFit: "contain" }}
            priority
          />
          {vendorName && (
            <div className="mt-1">
              <p className="text-xs text-gray-600">{t("from")}</p>
              <p className="font-semibold text-sm">{vendorName}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center">
          {order.qr_code && (
            <QRCodeSVG
              value={order.qr_code}
              size={70}
              level="M"
              style={{ width: "70px", height: "70px" }}
            />
          )}
        </div>
      </div>

      {/* Order Number & Track Number */}
      <div
        className="border-b-2 border-black pb-2 mb-2"
        style={{ borderBottomWidth: "2px" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">
              {t("orderNumber")}
            </p>
            <p className="font-bold text-lg font-mono" dir="ltr">
              {order.order_number}
            </p>
          </div>
          <div className="text-end">
            <p className="text-xs text-gray-600 uppercase tracking-wide">
              {t("trackingNumber")}
            </p>
            <p className="font-semibold text-sm font-mono" dir="ltr">
              {order.track_number}
            </p>
          </div>
        </div>
      </div>

      {/* Ship To Section */}
      <div
        className="border-b-2 border-black pb-2 mb-2"
        style={{ borderBottomWidth: "2px" }}
      >
        <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
          {t("shipTo")}
        </p>
        <div className="space-y-0.5">
          {customer.name && (
            <p className="font-bold text-base">{customer.name}</p>
          )}
          {customer.mobile && (
            <p className="font-mono text-sm" dir="ltr">
              {customer.mobile}
            </p>
          )}
          {(customer.full_address || customer.address) && (
            <p className="text-xs leading-tight">
              {customer.full_address || customer.address}
            </p>
          )}
          {customer.address_notes && (
            <p className="text-xs text-gray-600 italic">
              {customer.address_notes}
            </p>
          )}
          {(cityName || governorateName) && (
            <p className="text-xs font-medium">
              {[cityName, governorateName].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Items Section with COD Badge */}
      <div
        className="border-b-2 border-black pb-2 mb-2"
        style={{ borderBottomWidth: "2px" }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-600 uppercase tracking-wide">
            {t("items")}: {totalItems}
          </p>
          {isCOD && (
            <span
              className="px-2 py-0.5 text-xs font-bold uppercase rounded"
              style={{
                backgroundColor: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fbbf24"
              }}
            >
              {t("cod")}
            </span>
          )}
        </div>
        <div className="space-y-0.5">
          {items.slice(0, 4).map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="truncate flex-1" style={{ maxWidth: "75%" }}>
                {item.product_name || `${t("product")} ${i + 1}`}
              </span>
              <span className="font-mono">
                x{item.quantity || 1}
              </span>
            </div>
          ))}
          {items.length > 4 && (
            <p className="text-xs text-gray-500 italic">
              +{items.length - 4} {t("moreItems")}
            </p>
          )}
        </div>
      </div>

      {/* Total Amount */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-600 uppercase tracking-wide">
          {t("totalAmount")}
        </p>
        <p className="font-bold text-lg">
          {tCommon("egpSymbol")} {order.total_amount.toFixed(2)}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center pt-1">
        <p className="text-xs font-medium text-gray-700">
          {t("handleWithCare")} - Rahwan
        </p>
      </div>
    </div>
  );
}
