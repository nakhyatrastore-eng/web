import type { Metadata } from "next";
import CatalogueEmpty from "@/components/CatalogueEmpty";
import DropSlider from "@/components/DropSlider";
import ProductCard from "@/components/ProductCard";
import { dropSlides } from "@/lib/drops";
import { getCollectionByHandle, isShopifyConfigured } from "@/lib/shopify";
export const metadata: Metadata={title:"Nakhyatra — Objects with a point of view",description:"Designed phone cases and wall pieces, printed to order in India."};
export default async function HomePage(){
if(!isShopifyConfigured())return <main className="page-shell py-20"><CatalogueEmpty title="The current edit is being arranged." body="Please check back in a moment."/></main>;
const [casesCollection,postersCollection]=await Promise.all([getCollectionByHandle("phone-cases"),getCollectionByHandle("poster-wall")]);
const products=Array.from(new Map([...(casesCollection?.products??[]),...(postersCollection?.products??[])].map(p=>[p.id,p])).values());
if(!products.length)return <main className="page-shell py-20"><CatalogueEmpty title="The current edit is being arranged." body="Please check back in a moment."/></main>;
return <main className="bg-paper text-ink"><DropSlider slides={dropSlides}/><section className="mx-auto max-w-[1500px] px-5 py-14 md:px-10 lg:px-16"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-ink-3">Shop by mood</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em] md:text-6xl">The current edit</h1><p className="mt-3 max-w-xl text-sm leading-6 text-ink-2">Choose a design, select your phone model, and we print it when you order.</p><div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">{products.slice(0,12).map((product,index)=><ProductCard key={product.id} product={product} priority={index<4}/>)}</div></section><section className="border-y border-ink/10 bg-[#e8dfd3]"><div className="mx-auto max-w-[1500px] px-5 py-14 md:px-10 lg:px-16"><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-ink-3">The Nakhyatra standard</p><h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-.05em] md:text-6xl">Printed for your phone. Made for your point of view.</h2></div></section></main>;
}
