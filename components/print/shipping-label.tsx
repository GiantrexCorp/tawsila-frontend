"use client";

import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
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
  const isCOD = order.payment_method === "cod";

  // Format created date
  const createdDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  // Build region string
  const regionParts = [governorateName, cityName].filter(Boolean);
  const regionString = regionParts.join(" - ") || "-";

  return (
    <div
      className="shipping-label"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        width: "200mm",
        height: "140mm",
        padding: "4mm",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
        backgroundColor: "white",
        color: "black",
        border: "1px solid #000",
      }}
    >
      {/* Row 1: Logo + Barcode + QR Code */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid #000",
          paddingBottom: "3mm",
          marginBottom: "3mm",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/rahwan-logo-light.png"
            alt="Rahwan"
            width={150}
            height={57}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        {/* Barcode */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Barcode
            value={order.track_number || "N/A"}
            width={1.5}
            height={40}
            fontSize={12}
            margin={0}
            displayValue={true}
          />
        </div>

        {/* QR Code */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {order.qr_code && (
            <QRCodeSVG
              value={order.qr_code}
              size={80}
              level="M"
              style={{ width: "80px", height: "80px" }}
            />
          )}
        </div>
      </div>

      {/* Row 3: COD Amount */}
      <div
        style={{
          borderBottom: "2px solid #000",
          paddingBottom: "2mm",
          marginBottom: "2mm",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {t("codAmount")}:{" "}
          {isCOD ? (
            <span style={{ color: "#000" }}>
              {tCommon("egpSymbol")} {order.total_amount.toFixed(2)}
            </span>
          ) : (
            <span style={{ color: "#666" }}>{t("prepaid")}</span>
          )}
        </span>
      </div>

      {/* Row 4: From (Vendor) | Deliver To (Customer) */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #000",
          marginBottom: "2mm",
        }}
      >
        {/* Vendor Column */}
        <div
          style={{
            flex: "0 0 35%",
            borderRight: isRTL ? "none" : "1px solid #000",
            borderLeft: isRTL ? "1px solid #000" : "none",
            padding: "2mm",
          }}
        >
          <p style={{ fontSize: "10px", color: "#666", marginBottom: "1mm" }}>{t("from")}:</p>
          <p style={{ fontSize: "14px", fontWeight: "bold" }}>{vendorName || "-"}</p>
        </div>

        {/* Customer Column */}
        <div style={{ flex: "1", padding: "2mm" }}>
          <p style={{ fontSize: "10px", color: "#666", marginBottom: "1mm" }}>{t("deliverTo")}:</p>
          <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "1mm" }}>
            {customer.name || "-"}
          </p>
          <p style={{ fontSize: "12px", fontFamily: "monospace" }} dir="ltr">
            {customer.mobile || "-"}
          </p>
        </div>
      </div>

      {/* Row 5: Region */}
      <div
        style={{
          borderBottom: "1px solid #ccc",
          paddingBottom: "2mm",
          marginBottom: "2mm",
        }}
      >
        <span style={{ fontSize: "10px", color: "#666" }}>{t("region")} | </span>
        <span style={{ fontSize: "12px", fontWeight: "600" }}>{regionString}</span>
      </div>

      {/* Row 6: Address */}
      <div
        style={{
          borderBottom: "1px solid #ccc",
          paddingBottom: "2mm",
          marginBottom: "2mm",
        }}
      >
        <span style={{ fontSize: "10px", color: "#666" }}>{t("addressLabel")} | </span>
        <span style={{ fontSize: "11px" }}>
          {customer.full_address || customer.address || "-"}
        </span>
      </div>

      {/* Row 7: Landmark */}
      <div
        style={{
          borderBottom: "2px solid #000",
          paddingBottom: "2mm",
          marginBottom: "2mm",
        }}
      >
        <span style={{ fontSize: "10px", color: "#666" }}>{t("landmark")} | </span>
        <span style={{ fontSize: "11px" }}>{customer.address_notes || "-"}</span>
      </div>

      {/* Row 8: Items */}
      <div
        style={{
          borderBottom: "2px solid #000",
          paddingBottom: "2mm",
          marginBottom: "2mm",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1mm",
          }}
        >
          <span style={{ fontSize: "10px", color: "#666" }}>
            {t("shipmentDescription")} ({totalItems} {t("pieces")})
          </span>
        </div>
        <div style={{ fontSize: "11px" }}>
          {items.slice(0, 3).map((item, i) => (
            <span key={i}>
              {item.product_name || `${t("product")} ${i + 1}`} x{item.quantity || 1}
              {i < Math.min(items.length, 3) - 1 ? " | " : ""}
            </span>
          ))}
          {items.length > 3 && (
            <span style={{ color: "#666" }}> +{items.length - 3} {t("moreItems")}</span>
          )}
          {items.length === 0 && "-"}
        </div>
      </div>

      {/* Row 9: Notes */}
      <div
        style={{
          borderBottom: "2px solid #000",
          paddingBottom: "2mm",
          marginBottom: "2mm",
        }}
      >
        <span style={{ fontSize: "10px", color: "#666" }}>{t("notes")} | </span>
        <span style={{ fontSize: "11px" }}>{order.vendor_notes || "-"}</span>
      </div>

      {/* Row 10: Footer - Order Number + Date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span style={{ fontSize: "10px", color: "#666" }}>{t("orderNumber")}: </span>
          <span style={{ fontSize: "12px", fontWeight: "bold", fontFamily: "monospace" }}>
            {order.order_number}
          </span>
        </div>
        <div>
          <span style={{ fontSize: "10px", color: "#666" }}>{t("createdAt")}: </span>
          <span style={{ fontSize: "11px" }}>{createdDate}</span>
        </div>
      </div>
    </div>
  );
}
