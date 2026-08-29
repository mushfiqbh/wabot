"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentStatusPage({ params }: { params: { status: string } }) {
    const searchParams = useSearchParams();
    const isSuccess = params.status === "success";

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            {isSuccess ? (
                <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                    <p className="text-gray-600 mb-8 max-w-md">
                        Your subscription has been activated successfully. You can now start using all the premium features.
                    </p>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </Link>
                </>
            ) : (
                <>
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
                    <p className="text-gray-600 mb-8 max-w-md">
                        The payment process was cancelled or failed. Your wallet/account was not charged.
                    </p>
                    <Link
                        href="/pricing"
                        className="flex items-center gap-2 bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                    >
                        Try Again
                    </Link>
                </>
            )}
        </div>
    );
}
