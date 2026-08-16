import 'server-only';
import type { CartIssue, ShopifyCart } from './catalog';
import { getVariantCartRequirements } from './shopify';

export async function getCartIssues(cart: ShopifyCart | null): Promise<CartIssue[]> {
  const caseLines = (cart?.lines ?? []).filter((line) =>
    line.merchandise.product.productType.toLowerCase().includes('case')
  );
  const requirements = await Promise.all(
    caseLines.map((line) => getVariantCartRequirements(line.merchandise.id))
  );

  return caseLines.flatMap((line, index) => {
    const attributes = new Map(
      line.attributes.map((attribute) => [attribute.key, attribute.value.trim()])
    );
    const brand = attributes.get('Phone Brand');
    const model = attributes.get('Phone Model');
    const base = {
      lineId: line.id,
      merchandiseId: line.merchandise.id,
      productTitle: line.merchandise.product.title,
    };
    if (!brand || !model) {
      return [{
        ...base,
        message: 'Choose the exact phone model for this case before checkout.',
      }];
    }
    const remainsValid = requirements[index]?.deviceModels.some(
      (device) => device.active && device.brand === brand && device.model === model
    );
    return remainsValid
      ? []
      : [{
          ...base,
          message: `${model} is no longer available for this case. Choose another model.`,
        }];
  });
}
