import { config as dotenvConfig } from "dotenv";
dotenvConfig();

interface IConfig {
  goerli: {
    provider_url: string;
    private_key: string;
  };
  solana_wallet_path: string;
}

export const getEnv = (key: string, defaultValue?: any) => {
  const value = process.env[key];
  if (!value) {
    if (defaultValue === undefined || defaultValue === null) {
      throw new Error(`Required env var ${key} not set`);
    } else {
      return defaultValue;
    }
  }
  if (value.toLocaleLowerCase() === "false") {
    return false;
  }
  if (value.toLocaleLowerCase() === "true") {
    return true;
  }
  return value;
};

export const envconfig: IConfig = {
  goerli: {
    provider_url: getEnv("GOERLI_PROVIDER_URL", ""),
    private_key: getEnv("GOERLI_PRIVATE_KEY", ""),
  },
  solana_wallet_path: getEnv("SOLANA_WALLET_PATH", ""),
};
