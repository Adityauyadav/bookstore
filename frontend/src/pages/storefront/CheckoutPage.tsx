import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { ArrowLeft, MapPin, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCart } from "../../api/cart.api";
import { placeOrder, verifyPayment } from "../../api/orders.api";
import { useAuthStore } from "../../store/auth.store";
import type { ApiErrorResponse, ShippingAddress } from "../../types";

type ShippingField = keyof ShippingAddress;

type CheckoutOrder = {
  id: string;
  razorpayOrderId?: string;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const initialForm: ShippingAddress = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState<ShippingAddress>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ShippingField, string>>
  >({});
  const [submitError, setSubmitError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: ({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    }: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate(`/orders/${response.data.id}`);
    },
    onError: (error) => {
      const apiError = error as AxiosError<ApiErrorResponse>;
      setSubmitError(
        apiError.response?.data?.message ??
          "Payment verification failed. Please contact support if money was deducted.",
      );
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: (shippingAddress: ShippingAddress) =>
      placeOrder(shippingAddress),
    onSuccess: async (response) => {
      const order = response.data as CheckoutOrder;
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!window.Razorpay || !razorpayKeyId || !order.razorpayOrderId) {
        setSubmitError(
          "Payment gateway is not configured correctly. Please try again later.",
        );
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        name: "BucketList Bookstore",
        description: "Complete your order",
        order_id: order.razorpayOrderId,
        handler: async (razorpayResponse) => {
          await verifyPaymentMutation.mutateAsync({
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            razorpaySignature: razorpayResponse.razorpay_signature,
          });
        },
        prefill: {
          name: form.name || user?.name,
          email: user?.email,
          contact: form.phone,
        },
        theme: {
          color: "#1d1a17",
        },
        modal: {
          ondismiss: () => {
            setSubmitError("Payment was cancelled before completion.");
          },
        },
      });

      rzp.open();
    },
    onError: (error) => {
      const apiError = error as AxiosError<ApiErrorResponse>;
      setSubmitError(
        apiError.response?.data?.message ??
          "We couldn't place your order. Please try again.",
      );
    },
  });

  const cart = data?.data;
  const items = cart?.items ?? [];

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.book.price) * item.quantity,
        0,
      ),
    [items],
  );

  const validateForm = () => {
    const nextErrors: Partial<Record<ShippingField, string>> = {};

    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.phone.trim()) nextErrors.phone = "Phone is required";
    if (!form.line1.trim()) nextErrors.line1 = "Address line 1 is required";
    if (!form.city.trim()) nextErrors.city = "City is required";
    if (!form.state.trim()) nextErrors.state = "State is required";
    if (!form.pincode.trim()) nextErrors.pincode = "Pincode is required";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field: ShippingField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitError("");
    await placeOrderMutation.mutateAsync(form);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.9fr)]">
        <div className="h-136 animate-pulse rounded-[1.75rem] bg-white" />
        <div className="h-104 animate-pulse rounded-[1.75rem] bg-white" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-4xl border border-dashed border-black/10 bg-[#fbf8f2] px-8 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white">
          <ShoppingBag className="h-6 w-6 text-text-muted" />
        </div>
        <h1 className="mt-6 font-serif text-4xl text-text-primary">
          Nothing to checkout
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          Add a few books to your cart first, then come back here to place the
          order.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-full bg-[#D84C35] px-5 py-3 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-[#b83a1f] shadow-md"
        >
          Back to storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Back to cart
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.9fr)]">
        <section className="rounded-[1.75rem] border border-black/8 bg-[#fbf8f2] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <MapPin size={18} className="text-text-primary" />
            </div>
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-text-muted">
                Shipping details
              </p>
              <h1 className="mt-1 font-serif text-3xl text-text-primary">
                Checkout
              </h1>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 grid gap-5 sm:grid-cols-2"
          >
            {(
              [
                ["name", "Name"],
                ["phone", "Phone"],
                ["line1", "Address line 1"],
                ["line2", "Address line 2 (optional)"],
                ["city", "City"],
                ["state", "State"],
                ["pincode", "Pincode"],
              ] as Array<[ShippingField, string]>
            ).map(([field, label]) => {
              const isFullWidth = field === "line1" || field === "line2";

              return (
                <label
                  key={field}
                  className={`${isFullWidth ? "sm:col-span-2" : ""} block`}
                >
                  <span className="mb-2 block text-[0.68rem] uppercase tracking-[0.2em] text-text-muted">
                    {label}
                  </span>
                  <input
                    type="text"
                    value={form[field] ?? ""}
                    onChange={(event) =>
                      handleChange(field, event.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-text-primary outline-none transition-all focus:border-black/20 focus:shadow-sm"
                  />
                  {fieldErrors[field] ? (
                    <p className="mt-2 text-sm text-[#8f2d22]">
                      {fieldErrors[field]}
                    </p>
                  ) : null}
                </label>
              );
            })}

            {submitError ? (
              <div className="sm:col-span-2 rounded-2xl border border-[#8f2d22]/15 bg-[#f8ece8] px-4 py-3 text-sm text-[#8f2d22]">
                {submitError}
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={
                  placeOrderMutation.isPending ||
                  verifyPaymentMutation.isPending
                }
                className="inline-flex w-full items-center justify-center rounded-full bg-[#D84C35] px-5 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#b83a1f] disabled:translate-y-0 disabled:opacity-60 shadow-md"
              >
                {placeOrderMutation.isPending || verifyPaymentMutation.isPending
                  ? "Processing..."
                  : "Place Order"}
              </button>
            </div>
          </form>
        </section>

        <aside className="h-fit rounded-[1.75rem] border border-black/8 bg-[#fbf8f2] p-6">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-text-muted">
            Order summary
          </p>
          <h2 className="mt-3 font-serif text-3xl text-text-primary">
            Review your order
          </h2>

          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-[1.25rem] bg-white p-3"
              >
                <img
                  src={item.book.coverImageUrl}
                  alt={item.book.title}
                  className="aspect-3/4 w-16 rounded-[0.9rem] object-cover"
                />
                <div className="min-w-0">
                  <p className="font-serif text-lg leading-tight text-text-primary">
                    {item.book.title}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Qty {item.quantity}
                  </p>
                  <p className="mt-2 text-sm text-[#8f2d22]">
                    {formatPrice(Number(item.book.price) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-black/8 pt-5">
            <div className="flex items-center justify-between text-sm text-text-muted">
              <span>Total amount</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-serif text-xl text-text-primary">
                Payable
              </span>
              <span className="font-serif text-2xl text-[#8f2d22]">
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
