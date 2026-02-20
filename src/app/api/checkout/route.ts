import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// @ts-ignore - Stripe API version might differ between definition and installation
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export async function POST(req: Request) {
    try {
        const { booking_id, service_name, customer_name, deposit_amount } = await req.json();

        if (!booking_id) {
            return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
        }

        // Create a Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'fpx'],
            line_items: [
                {
                    price_data: {
                        currency: 'myr',
                        product_data: {
                            name: `Deposit for ${service_name}`,
                            description: `Booking confirmation deposit for ${customer_name}`,
                            // You can add an image URL here if you have a hosted logo
                            // images: ['https://your-domain.com/logo.png'],
                        },
                        unit_amount: deposit_amount * 100, // Stripe expects amounts in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // We attach the booking_id to the metadata so we know what to update later
            metadata: {
                booking_id: booking_id,
            },
            // Redirect back to the frontend with success/cancel params
            success_url: `${req.headers.get('origin')}/?success=true&booking_id=${booking_id}`,
            cancel_url: `${req.headers.get('origin')}/?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Error creating Stripe checkout session:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
