"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface Subscription {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  startDate: string;
  endDate: string;
  paymentReference: string;
  createdAt: string;
}

const SUBSCRIPTION_PLANS = [
  {
    name: "Basic",
    price: 5000,
    duration: "1 month",
    features: [
      "Up to 50 appointments per month",
      "Basic patient management",
      "Email support",
      "Mobile app access",
    ],
  },
  {
    name: "Professional",
    price: 12000,
    duration: "3 months",
    features: [
      "Up to 150 appointments per month",
      "Advanced patient management",
      "Medical records management",
      "Priority support",
      "Analytics dashboard",
      "Mobile app access",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: 20000,
    duration: "6 months",
    features: [
      "Unlimited appointments",
      "Full patient management suite",
      "Advanced medical records",
      "24/7 priority support",
      "Advanced analytics",
      "API access",
      "Mobile app access",
      "Custom branding",
    ],
  },
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<
    Subscription[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch("/api/doctor/subscription");
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data.current);
        setSubscriptionHistory(data.history);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: string, amount: number) => {
    try {
      const response = await fetch("/api/doctor/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName, amount }),
      });

      if (response.ok) {
        const data = await response.json();
        // In a real app, you would redirect to payment gateway
        addToast({
          type: "success",
          title: "Subscription Created",
          description: `Payment reference: ${data.paymentReference}`
        });
        fetchSubscriptionData();
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "expired":
        return "destructive";
      case "cancelled":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return CheckCircle;
      case "expired":
        return AlertCircle;
      case "cancelled":
        return AlertCircle;
      case "pending":
        return Clock;
      default:
        return Clock;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subscription Management</h1>
          <p className="text-gray-600">
            Manage your DFC Medical subscription and billing
          </p>
        </div>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">
                    {currentSubscription.planName} Plan
                  </h3>
                  <Badge variant={getStatusColor(currentSubscription.status)}>
                    {currentSubscription.status}
                  </Badge>
                </div>
                <div className="text-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(
                        currentSubscription.startDate,
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        currentSubscription.endDate,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    {currentSubscription.status === "ACTIVE" && (
                      <span className="text-green-600">
                        {getDaysRemaining(currentSubscription.endDate)} days
                        remaining
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ₦{currentSubscription.amount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  Ref: {currentSubscription.paymentReference}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? "border-blue-500 shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  ₦{plan.price.toLocaleString()}
                </div>
                <CardDescription>{plan.duration}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.name, plan.price)}
                  disabled={currentSubscription?.status === "ACTIVE"}
                >
                  {currentSubscription?.status === "ACTIVE"
                    ? "Current Plan"
                    : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Subscription History */}
      {subscriptionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
            <CardDescription>
              Your past and current subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionHistory.map((subscription) => {
                const StatusIcon = getStatusIcon(subscription.status);
                return (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <StatusIcon className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium">
                          {subscription.planName} Plan
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(
                            subscription.startDate,
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(subscription.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                        <span className="font-medium">
                          ₦{subscription.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {subscription.paymentReference}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Active Subscription */}
      {!currentSubscription && (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Active Subscription
            </h3>
            <p className="text-gray-500 mb-6">
              Choose a subscription plan to start using DFC Medical services
            </p>
            <Button
              onClick={() =>
                document
                  .querySelector(".grid")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View Plans
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
