/**
 * Configuration Validator Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import type { ConfigTypes } from "../../types/CreateApiTypes.js";
/**
 * Configuration validator and defaults provider
 */
export declare class ConfigValidator {
    private static readonly DEFAULT_CONFIG;
    /**
     * Validate and merge configuration with defaults
     */
    static validate(config: ConfigTypes): Required<ConfigTypes>;
    /**
     * Get default configuration
     */
    static getDefaults(): Required<ConfigTypes>;
}
//# sourceMappingURL=ConfigValidator.d.ts.map