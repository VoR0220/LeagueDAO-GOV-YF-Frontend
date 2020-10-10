import React from 'react';
import BigNumber from 'bignumber.js';

import { assertValues, batchContract, createContract, getHumanValue, sendContract } from 'web3/utils';

export type SUSDContract = {
  symbol?: string;
  decimals?: number;
  totalSupply?: BigNumber;
  balance?: BigNumber;
  allowance?: BigNumber;
  approveSend: (value: BigNumber) => void;
};

const InitialDataState: SUSDContract = {
  symbol: undefined,
  decimals: undefined,
  totalSupply: undefined,
  balance: undefined,
  allowance: undefined,
  approveSend: () => null,
};

const Contract = createContract(
  require('web3/abi/susd.json'),
  String(process.env.REACT_APP_CONTRACT_SUSD_ADDR),
);

export function useSUSDContract(account?: string): SUSDContract {
  const [data, setData] = React.useState<SUSDContract>(InitialDataState);

  React.useEffect(() => {
    (async () => {
      const [symbol, decimals, totalSupply] = await batchContract(Contract, [
        'symbol',
        'decimals',
        'totalSupply',
      ]);

      setData(prevState => ({
        ...prevState,
        symbol,
        decimals: Number(decimals),
        totalSupply: getHumanValue(new BigNumber(totalSupply), Number(decimals)),
      }));
    })();
  }, []);

  React.useEffect(() => {
    if (!assertValues(account, data.decimals)) {
      return;
    }

    (async () => {
      const [balance, allowance] = await batchContract(Contract, [
        { method: 'balanceOf', methodArgs: [account] },
        { method: 'allowance', methodArgs: [account, process.env.REACT_APP_CONTRACT_STAKING_ADDR] },
      ]);

      setData(prevState => ({
        ...prevState,
        balance: getHumanValue(new BigNumber(balance), data.decimals),
        allowance: new BigNumber(allowance),
      }));
    })();
  }, [account, data.decimals]);

  function approveSend(value: BigNumber) {
    if (!assertValues(account)) {
      return;
    }

    return sendContract(Contract, 'approve', [
      process.env.REACT_APP_CONTRACT_STAKING_ADDR,
      value,
    ], {
      from: account,
    });
  }

  return {
    ...data,
    approveSend,
  };
}
