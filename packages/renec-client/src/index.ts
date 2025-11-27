/**
 * @avala/renec-client
 *
 * RENEC (CONOCER) data harvester and client for Avala
 * Ports the Python renec-harvester to TypeScript with Playwright
 */

// Types
export * from './types';

// Utilities
export * from './utils/helpers';

// Drivers
export { BaseDriver } from './drivers/base.driver';
export { ECDriver } from './drivers/ec.driver';
export { CertifierDriver } from './drivers/certifier.driver';
export { CenterDriver } from './drivers/center.driver';

// Convenience factory
import { ECDriver } from './drivers/ec.driver';
import { CertifierDriver } from './drivers/certifier.driver';
import { CenterDriver } from './drivers/center.driver';
import type { DriverConfig } from './types';

export type DriverType = 'ec' | 'certifier' | 'center';

export function createDriver(type: DriverType, config?: DriverConfig) {
  switch (type) {
    case 'ec':
      return new ECDriver(config);
    case 'certifier':
      return new CertifierDriver(config);
    case 'center':
      return new CenterDriver(config);
    default:
      throw new Error(`Unknown driver type: ${type}`);
  }
}

// Full harvest orchestrator
export async function harvestAll(config?: DriverConfig) {
  const ecDriver = new ECDriver(config);
  const certifierDriver = new CertifierDriver(config);
  const centerDriver = new CenterDriver(config);

  const [ecStandards, certifiers, centers] = await Promise.all([
    ecDriver.harvest(),
    certifierDriver.harvest(),
    centerDriver.harvest(),
  ]);

  return {
    ecStandards,
    certifiers,
    centers,
    stats: {
      ec: ecDriver.getStats(),
      certifier: certifierDriver.getStats(),
      center: centerDriver.getStats(),
    },
  };
}
