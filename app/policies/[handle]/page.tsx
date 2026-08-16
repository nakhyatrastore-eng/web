import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const policies = {
  shipping: {
    title: 'Shipping',
    intro: 'How an order moves from confirmation to your door.',
    sections: [
      ['How fulfilment works', 'Nakhyatra does not manufacture products in-house. We create or curate the designs, purchase compatible blanks or finished products, and coordinate printing and fulfilment with production partners.'],
      ['Processing time', 'Phone cases normally require 3–6 business days before dispatch. Metal wall prints normally require 4–7 business days. These are working estimates, not guaranteed delivery dates. We will contact you if an order is likely to take materially longer.'],
      ['Transit time', 'After dispatch, most serviceable Indian PIN codes normally receive parcels in 3–8 business days. Remote locations, weather, public holidays, carrier delays, or address problems can extend transit time.'],
      ['Shipping charges and payment', 'The shipping charge and payment methods available for your address, including COD when supported, are shown before payment at checkout. We do not advertise a free-shipping threshold unless it is active there.'],
      ['Tracking', 'A dispatch confirmation is sent to the email or phone used at checkout when carrier tracking becomes available. Tracking can take up to 24 hours to show its first scan.'],
      ['Address changes', 'Contact us within 12 hours of ordering. We will try to help, but an address cannot be changed after production or carrier handover has begun.'],
      ['Lost or delayed parcels', 'If tracking has not moved for 5 business days, contact us with your order number. We will raise the issue with the carrier and share the available resolution.'],
    ],
  },
  returns: {
    title: 'Returns & replacements',
    intro: 'Clear support for damaged, defective, or incorrect orders.',
    sections: [
      ['Order cancellation', 'Ask to cancel within 12 hours of ordering. Cancellation is possible only before printing, procurement, or fulfilment begins. Once work has started for a selected model, size, or design, the order cannot be cancelled for a change of mind.'],
      ['Eligible issues', 'Contact us within 7 calendar days of delivery if the item arrived damaged, has a material print defect, or is different from the product, phone model, size, or quantity confirmed in your order.'],
      ['What to send', 'Include the order number, a clear photo of the complete item, close-ups of the issue, and photos of the outer packaging for transit damage. Keep the product and packaging until the case is resolved.'],
      ['Not eligible', 'We cannot accept change-of-mind returns, an incorrectly selected phone model or poster size, normal colour differences between screens and physical print, ordinary wear, misuse, or damage after delivery.'],
      ['Resolution', 'After verification, we may arrange a replacement, reprint, missing-item shipment, or refund. When a return is needed for an eligible issue, we will provide instructions and bear reasonable return shipping costs. Do not send a parcel without approval.'],
      ['Refund timing', 'Approved refunds are sent to the original payment method. Banks and payment providers normally take 7–10 business days after processing to display the credit. COD refunds may require verified bank or UPI details shared through our official support channel.'],
    ],
  },
  privacy: {
    title: 'Privacy',
    intro: 'How Nakhyatra Store collects and uses information needed to run the shop.',
    sections: [
      ['Who is responsible', 'Nakhyatra Store is responsible for this storefront and its customer information practices. Privacy and grievance requests can be sent to nakhyatrastore@gmail.com or +91 93953 34322.'],
      ['Information we use', 'We may receive your name, contact details, shipping and billing address, order contents, customer-service messages, device preferences, cart information, and payment status. Payment card or UPI credentials are processed by the payment provider and are not stored by this storefront.'],
      ['Why we use it', 'Information is used to provide the storefront, confirm and fulfil orders, coordinate production and delivery, prevent misuse, support customers, process eligible refunds, maintain business records, and meet legal obligations.'],
      ['Service providers', 'Shopify supports catalogue, cart, checkout, account, payment, and order operations. Vercel hosts the storefront. Carriers and production partners receive only the information reasonably needed to fulfil an order. UploadThing is used only when the custom-artwork studio is active.'],
      ['Store measurement', 'Vercel Web Analytics records privacy-minded, aggregated storefront visits and conversion events such as phone-model selection, add to cart, and checkout start. We do not send payment credentials or uploaded artwork to analytics.'],
      ['Cookies and local storage', 'A secure HTTP-only cookie keeps the Shopify cart connected to your browser. Local browser storage remembers interface preferences such as a selected phone model. Blocking these technologies may prevent parts of the shop from working.'],
      ['Retention and requests', 'We retain order and support records only as long as reasonably necessary for fulfilment, fraud prevention, accounting, disputes, and legal obligations. Contact us to ask about access, correction, or deletion; some records may need to be retained by law.'],
      ['Security and children', 'We use reasonable technical and organisational safeguards, but no online service can promise absolute security. The store is not directed to children under 18 without the involvement of a parent or legal guardian.'],
    ],
  },
  terms: {
    title: 'Terms',
    intro: 'The practical terms for browsing Nakhyatra and placing an order.',
    sections: [
      ['Seller', 'The seller is Nakhyatra Store, a proprietary micro enterprise registered under Udyam number UDYAM-AS-03-0097671. Nakhyatra is not currently registered under GST.'],
      ['Products and fulfilment', 'Nakhyatra develops or curates designs and coordinates supply, printing, and fulfilment with production partners. Product images are illustrative; screen colour, scale, placement, and minor production tolerances may differ from the physical item.'],
      ['Prices and payment', 'Prices are shown in Indian rupees. Shipping charges and available payment methods are confirmed at checkout. An order is accepted after successful confirmation, but we may cancel and refund an order if payment cannot be verified, a product becomes unavailable, an address cannot be served, or lawful fulfilment is not possible.'],
      ['Customer selections', 'You are responsible for checking the selected phone model, poster size, delivery address, and contact information before payment. Selection errors are not treated as product defects.'],
      ['Artwork and intellectual property', 'Nakhyatra designs and licensed or curated artwork may not be copied, reproduced, or resold without permission. For custom orders, you confirm that you own or are authorised to reproduce the uploaded image.'],
      ['Liability', 'Nothing in these terms limits rights that cannot lawfully be excluded. To the extent permitted by law, our responsibility for a product claim is limited to the price paid for the affected item and the remedies described in the returns policy.'],
      ['Governing law', 'These terms are governed by Indian law. Subject to applicable consumer rights, disputes are subject to the courts having jurisdiction over Guwahati, Assam.'],
      ['Acceptable use', 'Do not interfere with the storefront, upload malicious or unlawful files, scrape private endpoints, attempt unauthorised access, or misuse checkout and account services.'],
    ],
  },
  contact: {
    title: 'Contact',
    intro: 'Product, order, replacement, privacy, or grievance support.',
    sections: [
      ['Enterprise', 'Nakhyatra Store is a proprietary micro enterprise. Udyam registration: UDYAM-AS-03-0097671.'],
      ['Customer care', 'Email nakhyatrastore@gmail.com or call +91 93953 34322. For an order, include the order number and the email or phone used at checkout.'],
      ['Registered address', 'Nakhyatra Office, Flat No. 1, Bongara, Guwahati, Kamrup Metro, Assam 781015, India.'],
      ['Grievance support', 'Email Nakhyatra Store at nakhyatrastore@gmail.com or call +91 93953 34322. We acknowledge complaints within 48 hours, provide a complaint reference in the acknowledgement, and aim to resolve them within one month.'],
      ['Instagram', 'You can also reach @nakhyatra.store for general product questions. Do not send payment information or account credentials by direct message.'],
      ['Response context', 'For a replacement issue, attach clear product and packaging photos so the team can verify it without additional back-and-forth.'],
    ],
  },
} as const;

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  return Object.keys(policies).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const policy = policies[handle as keyof typeof policies];
  return policy ? {
    title: policy.title,
    description: policy.intro,
    alternates: { canonical: `/policies/${handle}` },
    openGraph: { title: `${policy.title} | Nakhyatra`, description: policy.intro, url: `/policies/${handle}` },
    twitter: { card: 'summary_large_image', title: `${policy.title} | Nakhyatra`, description: policy.intro, images: ['/og.png'] },
  } : {};
}

export default async function PolicyPage({ params }: Props) {
  const { handle } = await params;
  const policy = policies[handle as keyof typeof policies];
  if (!policy) notFound();
  return (
    <main className="page-shell py-14 md:py-24"><div className="max-w-4xl"><p className="eyebrow">Store information</p><h1 className="mt-5 font-display text-[clamp(3rem,8vw,7rem)] font-black uppercase leading-[.8] tracking-[-.06em] text-white">{policy.title}</h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-2">{policy.intro}</p><p className="mt-4 text-xs text-ink-3">Last updated: 3 August 2026</p><div className="mt-12 border-t border-line">{policy.sections.map(([title, body]) => <section key={title} className="grid gap-3 border-b border-line py-7 md:grid-cols-[220px_1fr]"><h2 className="font-display text-lg font-bold uppercase text-white">{title}</h2><p className="max-w-2xl text-sm leading-relaxed text-ink-2 md:text-base">{body}</p></section>)}</div>{handle === 'contact' ? <div className="mt-8 flex flex-wrap gap-3"><a href="mailto:nakhyatrastore@gmail.com" className="button-primary">Email support</a><a href="tel:+919395334322" className="button-ghost">Call customer care</a><a href="https://www.instagram.com/nakhyatra.store" target="_blank" rel="noopener noreferrer" className="button-ghost">Open Instagram</a></div> : null}</div></main>
  );
}
