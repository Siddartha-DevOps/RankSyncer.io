"use client";
import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: '$29',
      desc: 'Perfect for small blogs and niche sites.',
      features: ['30 AI Articles / mo', '1 Project', 'Keyword Tracking', 'Auto-internal linking'],
    },
    {
      name: 'Growth',
      price: '$79',
      desc: 'Best for professional content creators.',
      features: ['100 AI Articles / mo', '5 Projects', 'Advanced SERP Analytics', 'WordPress Integration'],
      popular: true,
    },
    {
      name: 'Agency',
      price: '$199',
      desc: 'Built for scale and SEO agencies.',
      features: ['Unlimited AI Articles', 'Unlimited Projects', 'Team Collaboration', 'Priority API Access'],
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center mb-20 px-8">
        <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">Simple, transparent pricing</h2>
        <p className="mt-4 text-xl text-slate-600">Scale your SEO growth without the manual headache.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-8">
        {plans.map((plan) => (
          <div 
            key={plan.name} 
            className={cn(
              "relative bg-white rounded-3xl p-8 shadow-xl flex flex-col border",
              plan.popular ? "border-blue-500 scale-105 z-10" : "border-slate-100"
            )}
          >
            {plan.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
              <span className="ml-1 text-slate-500">/month</span>
            </div>
            <p className="mt-4 text-sm text-slate-500 min-h-[40px] italic">{plan.desc}</p>
            
            <ul className="mt-8 space-y-4 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-center text-sm text-slate-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            
            <Link 
              href="/signup" 
              className={cn(
                "mt-8 block w-full py-3 px-4 rounded-xl text-center font-bold transition-all",
                plan.name === 'Growth' 
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200" 
                  : "bg-slate-100 text-slate-900 hover:bg-slate-200"
              )}
            >
              Get Started
            </Link>
          </div>
        ))}
      </div>
      
      <div className="mt-20 text-center text-slate-500 text-sm">
        <Link href="/login" className="hover:text-blue-600 underline">Back to Login</Link>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
