import { Injectable } from '@angular/core';
import {TransactionsService} from './transactions.service';
import {NotificationsService} from './notification-message/notifications.service';
import * as transactionsDescriptions from './transactions.descriptions';

import { environment } from '../environments/environment';


@Injectable({ providedIn: 'root' })
export class ContractService {

  public address = '';
  public usdcBalance = '';

  public web3;
  public web3m;  // Metamask
  public web3b;  // Biconomy

  constructor(private transactionsService: TransactionsService, private notifications: NotificationsService) {
  }

  getFixedTwoStr(value: number) {
    return (Math.max(0, value - 0.005)).toFixed(2).toString();
  }

  _wait(duration) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        resolve();
      }, duration);
    });
  }

  isConnected() {
    return window['ethereum'] && window['ethereum'].isConnected();
  }

  _waitForBiconomyReady(biconomy) {
    return new Promise((resolve, reject) => {
      biconomy.onEvent(biconomy.READY, () => {
        // Initialize your dapp here like getting user accounts etc
        resolve();
      }).onEvent(biconomy.ERROR, (error, message) => {
        // Handle error while initializing mexa
        reject(error);
      });
    });
  }

  _willUseBiconomy() {
    return parseInt(localStorage.getItem('willUseBiconomy')) || 0;
  }

  _getWeb3(): any {
    return this._willUseBiconomy() ? this.web3b : this.web3m;
  }

  async enable() {
    let res;
    try {
      res = await window['ethereum'].send('eth_requestAccounts');
    } catch(e) {
      return "";
    }

    setTimeout(async () => {
      const Biconomy = window['Biconomy'];
      const biconomy = new Biconomy(window['ethereum'], {apiKey: environment.biconomyAPIKey, debug: true});
      this.web3b = new window['Web3'](biconomy);
      try {
        await this._waitForBiconomyReady(biconomy);
      } catch(e) {
      }
    }, 0);

    const provider = environment.web3EndPoint ?
        new window['Web3'].providers.HttpProvider(environment.web3EndPoint) :
            window['ethereum'];
    this.web3 = new window['Web3'](provider);
    this.web3m = new window['Web3'](window['ethereum']);
    this.address = res && res.result ? res.result[0] : "";
    return this.address;
  }

  async balanceOf(tokenAddress, address, decimal) {
    const token = new this.web3.eth.Contract(environment.erc20Abi, tokenAddress);
    const value = await token.methods.balanceOf(address).call();
    return this.getFixedTwoStr((+value) / (10 ** decimal));
  }

  async getAllowance(tokenAddress, address, spender, decimal) {
    const token = new this.web3.eth.Contract(environment.erc20Abi, tokenAddress);
    const value = await token.methods.allowance(address, spender).call();
    return this.getFixedTwoStr((+value) / (10 ** decimal));
  }

  async loadUSDCBalance(address) {
    this.usdcBalance = await this.balanceOf(environment.usdcAddress, address, environment.usdcDecimals);
    return this.usdcBalance;
  }

  async getPredepositBalance(address) {
    const buyer = new this.web3.eth.Contract(environment.buyerAbi, environment.buyerAddress);
    const value = await buyer.methods.getBalance(address).call();
    return this.getFixedTwoStr((+value) / (10 ** environment.usdcDecimals))
  }

  async getTotalFuturePremium(address) {
    const buyer = new this.web3.eth.Contract(environment.buyerAbi, environment.buyerAddress);
    const value = await buyer.methods.getTotalFuturePremium(address).call();
    return this.getFixedTwoStr((+value) / (10 ** environment.usdcDecimals));
  }

  async getCurrentSubscription(assetIndex) {
    const buyer = new this.web3.eth.Contract(environment.buyerAbi, environment.buyerAddress);
    const value = await buyer.methods.currentSubscription(assetIndex).call();
    return this.getFixedTwoStr((+value) / (10 ** environment.usdcDecimals));
  }

  async getFutureSubscription(assetIndex) {
    const buyer = new this.web3.eth.Contract(environment.buyerAbi, environment.buyerAddress);
    const value = await buyer.methods.futureSubscription(assetIndex).call();
    return this.getFixedTwoStr((+value) / (10 ** environment.usdcDecimals));
  }

  async getAllSellerBalance(category) {
    const seller = new this.web3.eth.Contract(environment.sellerAbi, environment.sellerAddress);
    const value = await seller.methods.categoryBalance(category).call();
    return this.getFixedTwoStr((+value) / (10 ** environment.usdcDecimals));
  }

  async getSellerCurrentBalance(address, category) {
    const seller = new this.web3.eth.Contract(environment.sellerAbi, environment.sellerAddress);
    const value = await seller.methods.userBalance(address, category).call();
    return this.getFixedTwoStr((+value[0]) / (10 ** environment.usdcDecimals));
  }

  async getSellerFutureBalance(address, category) {
    const seller = new this.web3.eth.Contract(environment.sellerAbi, environment.sellerAddress);
    const value = await seller.methods.userBalance(address, category).call();
    return this.getFixedTwoStr((+value[1]) / (10 ** environment.usdcDecimals));
  }

  async isSellerCurrentBasket(address, assetIndex) {
    const seller = new this.web3.eth.Contract(environment.sellerAbi, environment.sellerAddress);
    return await seller.methods.userBasket(address, assetIndex).call();
  }

  async getAllGuarantorBalance(assetIndex, decimal) {
    const guarantor = new this.web3.eth.Contract(environment.guarantorAbi, environment.guarantorAddress);
    const value = await guarantor.methods.assetBalance(assetIndex).call();
    return this.getFixedTwoStr((+value) / (10 ** decimal));
  }

  async getGuarantorUserBalance(address, assetIndex, decimal) {
    const guarantor = new this.web3.eth.Contract(environment.guarantorAbi, environment.guarantorAddress);
    const value = await guarantor.methods.userBalance(address, assetIndex).call();
    return {
      currentBalance: this.getFixedTwoStr((+value[0]) / (10 ** decimal)),
      futureBalance: this.getFixedTwoStr((+value[1]) / (10 ** decimal))
    };
  }

  _send(sendHandler, transaction) {
    return new Promise( (resolve, reject) => {
      sendHandler
        .once('transactionHash', (transactionHash) => {
          this.transactionsService.addTransaction({
            action: 'START',
            type: transaction.type,
            transactionHash
          });
        })
        .once('confirmation', (confirmationNumber, receipt) => {
          this.transactionsService.updateTransaction({
            action: 'SUCCESS',
            transactionHash: receipt.transactionHash,
            type: transaction.type
          });

          this.notifications.showNotification({
            title: transaction.type,
            body: `Success. Thanks for ${transaction.type}`,
            transactionHash: receipt.transactionHash,
            type: 'success'
          });

          resolve(receipt);
        })
        .once('error', (error) => {
          this.transactionsService.updateTransaction({
            action: 'ERROR',
            transactionHash: error.receipt ? error.receipt.transactionHash : null,
            type: transaction.type,
          });

          this.notifications.showNotification({
            title: transaction.type,
            body: error.code === 4001 ? 'Transaction rejected' : 'Transaction fails',
            transactionHash: error['receipt'] ? error['receipt']['transactionHash'] : null,
            type: 'error'
          });

          reject(error);
        });
    });
  }

  _decToHex(x, decimal) {
    if (x == 0) return '0x0';
    let str = x;
    for (var index = 0; index < decimal; index++) {
      str += "0";
    }

    let pos = str.indexOf(".");
    if (pos != -1) {
      str = str.substr(0, pos) + str.substr(pos + 1, decimal);
    }

    var dec = str.toString().split(''), sum = [], hex = [], i, s
    while (dec.length) {
      s = 1 * parseInt(dec.shift())
      for (i = 0; s || i < sum.length; i++) {
        s += (sum[i] || 0) * 10
        sum[i] = s % 16
        s = (s - sum[i]) / 16
      }
    }

    while (sum.length) {
      hex.push(sum.pop().toString(16));
    }

    return '0x' + hex.join('');
  }

  async buyerDeposit(amount) {
    const buyer = new (this._getWeb3().eth.Contract)(environment.buyerAbi, environment.buyerAddress);
    const res = buyer.methods.deposit(this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.buyerDepositTransaction);
  }

  async buyerWithdraw(amount) {
    const buyer = new (this._getWeb3().eth.Contract)(environment.buyerAbi, environment.buyerAddress);
    const res = buyer.methods.withdraw(this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.buyerWithdrawTransaction);
  }

  async buyerSubscribe(assetIndex, amount) {
    const buyer = new (this._getWeb3().eth.Contract)(environment.buyerAbi, environment.buyerAddress);
    const res = buyer.methods.subscribe(assetIndex, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.buyerSubscribeTransaction);
  }

  async buyerUnsubscribe(assetIndex, amount) {
    const buyer = new (this._getWeb3().eth.Contract)(environment.buyerAbi, environment.buyerAddress);
    const res = buyer.methods.unsubscribe(assetIndex, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.buyerUnsubscribeTransaction);
  }

  async sellerDeposit(category, amount) {
    const seller = new (this._getWeb3().eth.Contract)(environment.sellerAbi, environment.sellerAddress);
    const res = seller.methods.deposit(category, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.sellerDepositTransaction);
  }

  async sellerReduceDeposit(category, amount) {
    const seller = new (this._getWeb3().eth.Contract)(environment.sellerAbi, environment.sellerAddress);
    const res = seller.methods.reduceDeposit(category, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.sellerReduceDepositTransaction);
  }

  async sellerWithdraw(category, amount) {
    const seller = new (this._getWeb3().eth.Contract)(environment.sellerAbi, environment.sellerAddress);
    const res = seller.methods.withdraw(category, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.sellerWithdrawTransaction);
  }

  async sellerUserBasket(who, assetIndex) {
    const seller = new this.web3.eth.Contract(environment.sellerAbi, environment.sellerAddress);
    const value = await seller.methods.userBasket(who, assetIndex).call();
    return +value;
  }

  async sellerChangeBasket(category, basketIndexes) {
    const seller = new (this._getWeb3().eth.Contract)(environment.sellerAbi, environment.sellerAddress);
    const res = seller.methods.changeBasket(category, basketIndexes).send({from: this.address});
    return this._send(res, transactionsDescriptions.sellerBasketUpdatingTransaction);
  }

  async guarantorDeposit(assetIndex, amount, decimals) {
    const guarantor = new (this._getWeb3().eth.Contract)(environment.guarantorAbi, environment.guarantorAddress);
    const res = guarantor.methods.deposit(assetIndex, this._decToHex(amount, decimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.guarantorDepositTransaction);
  }

  async guarantorReduceDeposit(assetIndex, amount, decimals) {
    const guarantor = new (this._getWeb3().eth.Contract)(environment.guarantorAbi, environment.guarantorAddress);
    const res = guarantor.methods.reduceDeposit(assetIndex, this._decToHex(amount, decimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.guarantorReduceDepositTransaction);
  }

  async guarantorWithdraw(assetIndex, amount, decimals) {
    const guarantor = new (this._getWeb3().eth.Contract)(environment.guarantorAbi, environment.guarantorAddress);
    const res = guarantor.methods.withdraw(assetIndex, this._decToHex(amount, decimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.guarantorWithdrawTransaction);
  }

  async getNextWeekBasket(who, category) {
    const seller = new this.web3.eth.Contract(environment.sellerAbi, environment.sellerAddress);
    const week = +(await seller.methods.getCurrentWeek().call());
    const request = await seller.methods.basketRequestMap(who, week + 1, category).call();
    if (request.time > 0) {
      const indexes = await seller.methods.getPendingBasket(who, category, week + 1).call();
      return {has: true, indexes: indexes};
    } else {
      return {has: false, indexes: []};
    }
  }

  async getNextNextWeekBasket(who, category) {
    const seller = new this.web3.eth.Contract(environment.sellerAbi, environment.sellerAddress);
    const week = +(await seller.methods.getCurrentWeek().call());
    const request = await seller.methods.basketRequestMap(who, week + 2, category).call();
    if (request.time > 0) {
      const indexes = await seller.methods.getPendingBasket(who, category, week + 2).call();
      return {has: true, indexes: indexes};
    } else {
      return {has: false, indexes: []};
    }
  }

  async getPendingBasket(who, category) {
    let data = await this.getNextNextWeekBasket(who, category);
    if (data.has) return data;
    return await this.getNextWeekBasket(who, category);
  }

  async getSellerNextWeekWithdraw(who, category) {
    const seller = new this.web3.eth.Contract(environment.sellerAbi, environment.sellerAddress);
    const week = +(await seller.methods.getCurrentWeek().call());
    const request = await seller.methods.withdrawRequestMap(who, week + 1, category).call();
    return +(this.getFixedTwoStr((+request.amount) / (10 ** environment.usdcDecimals)));
  }

  async getSellerNextNextWeekWithdraw(who, category) {
    const seller = new this.web3.eth.Contract(environment.sellerAbi, environment.sellerAddress);
    const week = +(await seller.methods.getCurrentWeek().call());
    const request = await seller.methods.withdrawRequestMap(who, week + 2, category).call();
    return +(this.getFixedTwoStr((+request.amount) / (10 ** environment.usdcDecimals)));
  }

  async getGuarantorNextWeekWithdraw(who, assetIndex, decimal) {
    const guarantor = new this.web3.eth.Contract(environment.guarantorAbi, environment.guarantorAddress);
    const week = +(await guarantor.methods.getCurrentWeek().call());
    const request = await guarantor.methods.withdrawRequestMap(who, week + 1, assetIndex).call();
    return +(this.getFixedTwoStr((+request.amount) / (10 ** decimal)));
  }

  async getGuarantorNextNextWeekWithdraw(who, assetIndex, decimal) {
    const guarantor = new this.web3.eth.Contract(environment.guarantorAbi, environment.guarantorAddress);
    const week = +(await guarantor.methods.getCurrentWeek().call());
    const request = await guarantor.methods.withdrawRequestMap(who, week + 2, assetIndex).call();
    return +(this.getFixedTwoStr((+request.amount) / (10 ** decimal)));
  }

  async getUserSellerInfo(who) {
    const seller = new this.web3.eth.Contract(environment.sellerAbi, environment.sellerAddress);
    return await seller.methods.userInfo(who).call();
  }

  async getUserGuarantorInfo(who) {
    const guarantor = new this.web3.eth.Contract(environment.guarantorAbi, environment.guarantorAddress);
    return await guarantor.methods.userInfo(who).call();
  }

  async getUserBuyerInfo(who) {
    const buyer = new this.web3.eth.Contract(environment.buyerAbi, environment.buyerAddress);
    return await buyer.methods.userInfoMap(who).call();
  }

  async getCurrentWeek() {
    const buyer = new this.web3.eth.Contract(environment.buyerAbi, environment.buyerAddress);
    return +(await buyer.methods.getCurrentWeek().call());
  }

  async getNetworkName() {
    await this._wait(1000);

    if (!window['ethereum']) return 'unknown';

    const id = +window['ethereum'].chainId;

    switch(id) {
      case 1:
        return 'main';
      case 2:
        return 'morden';
      case 3:
        return 'ropsten';
      case 4:
        return 'rinkeby';
      case 5:
        return 'goerli';
      case 42:
        return 'kovan';
      case 56:
        return 'bsc';
      case 137:
        return 'matic';
      case 80001:
        return 'matic-mumbai'
      default:
        return 'unknown';
    }
  }

  async buyerClaimBonus() {
    const buyer = new (this._getWeb3().eth.Contract)(environment.buyerAbi, environment.buyerAddress);
    const res = buyer.methods.claimBonus().send({from: this.address});
    console.log('Buyer Claim Bonus');
    return await this._send(res, transactionsDescriptions.buyerClaimBonusTransaction);
  }

  async sellerClaimBonus() {
    const seller = new (this._getWeb3().eth.Contract)(environment.sellerAbi, environment.sellerAddress);
    const res = seller.methods.claimBonus().send({from: this.address});
    console.log('Seller Claim Bonus');
    return await this._send(res, transactionsDescriptions.sellerClaimBonusTransaction);
  }

  async sellerClaimMoreBonus(pid_) {
    const moreBonusHelper = new (this._getWeb3().eth.Contract)(environment.moreBonusHelperAbi, environment.moreBonusHelperAddress);
    const res = moreBonusHelper.methods.claim(pid_).send({from: this.address});
    console.log('Seller Claim More Bonus');
    return await this._send(res, transactionsDescriptions.sellerClaimMoreBonusTransaction);
  }

  async guarantorClaimBonus() {
    const guarantor = new (this._getWeb3().eth.Contract)(environment.guarantorAbi, environment.guarantorAddress);
    const res = guarantor.methods.claimBonus().send({from: this.address});
    console.log('Guarantor Claim Bonus');
    return await this._send(res, transactionsDescriptions.guarantorClaimBonusTransaction);
  }

  async sellerClaimPremium() {
    const seller = new (this._getWeb3().eth.Contract)(environment.sellerAbi, environment.sellerAddress);
    const res = seller.methods.claimPremium().send({from: this.address});
    console.log('Seller Claim Premium');
    return await this._send(res, transactionsDescriptions.sellerClaimPremiumTransaction);
  }

  async guarantorClaimPremium() {
    const guarantor = new (this._getWeb3().eth.Contract)(environment.guarantorAbi, environment.guarantorAddress);
    const res = guarantor.methods.claimPremium().send({from: this.address});
    console.log('Guarantor Claim Premium');
    return await this._send(res, transactionsDescriptions.guarantorClaimPremiumTransaction);
  }

  async getStakingPendingReward() {
    const staking = new this.web3.eth.Contract(environment.stakingAbi, environment.stakingAddress);
    const value = await staking.methods.pendingReward(this.address).call();
    return +(this.getFixedTwoStr((+value) / (10 ** environment.tidalDecimals)));
  }

  async stakingClaim() {
    const staking = new (this._getWeb3().eth.Contract)(environment.stakingAbi, environment.stakingAddress);
    const res = staking.methods.claim().send({from: this.address});
    console.log('Staking Claim');
    return await this._send(res, transactionsDescriptions.stakingClaimTransaction);
  }

  async stakingDeposit(amount: number) {
    const staking = new (this._getWeb3().eth.Contract)(environment.stakingAbi, environment.stakingAddress);
    const res = staking.methods.deposit(this._decToHex(amount, environment.tidalDecimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.stakingDepositTransaction);
  }

  async stakingWithdraw(amount: number) {
    const staking = new (this._getWeb3().eth.Contract)(environment.stakingAbi, environment.stakingAddress);
    const res = staking.methods.withdraw(this._decToHex(amount, environment.tidalDecimals)).send({from: this.address});
    return await this._send(res, transactionsDescriptions.stakingWithdrawTransaction);
  }

  async getOneStakingWithdrawRequest(who, index) {
    const staking = new this.web3.eth.Contract(environment.stakingAbi, environment.stakingAddress);
    return await staking.methods.withdrawRequestMap(who, index).call();
  }

  async getMyStakingWithdrawRequests(from, to) {
    const res = [];
    let all = [];
    let i = 0;
    for (let index = from; index < to; ++index) {
      all.push((async (index, i) => {
        const entry = await this.getOneStakingWithdrawRequest(this.address, index);
        res[i] = entry;
      }) (index, i));

      ++i;

      if (all.length > 5) {
        await Promise.all(all);
        all = [];
      }
    }

    if (all.length > 0) {
      await Promise.all(all);
    }

    return res;
  }

  async getStakingApr() {
    const stakingHelper = new this.web3.eth.Contract(environment.stakingHelperAbi, environment.stakingHelperAddress);
    try {
      return await stakingHelper.methods.getStakingAPR().call();
    } catch(e) {
      return 0;
    }
  }

  async switchToMatic() {
    await window['ethereum'].request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x89', // A 0x-prefixed hexadecimal string
          chainName: 'Matic Network',
          nativeCurrency: {
            name: 'Matic',
            symbol: 'Matic', // 2-6 characters long
            decimals: 18,
          },
          rpcUrls: ['https://rpc-mainnet.maticvigil.com'],
          blockExplorerUrls: ['https://polygonscan.com']
        }
      ]
    });
  }

  async switchToMaticMumbai() {
    await window['ethereum'].request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x13881', // A 0x-prefixed hexadecimal string
          chainName: 'Matic Mumbai',
          nativeCurrency: {
            name: 'Matic',
            symbol: 'Matic', // 2-6 characters long
            decimals: 18,
          },
          rpcUrls: ['https://matic-mumbai.chainstacklabs.com'],
          blockExplorerUrls: ['https://mumbai.polygonscan.com']
        }
      ]
    });
  }

  async getStakingPoolInfo() {
    const staking = new this.web3.eth.Contract(environment.stakingAbi, environment.stakingAddress);
    return await staking.methods.poolInfo().call();
  }

  async getStakingUserInfo(who_) {
    const staking = new this.web3.eth.Contract(environment.stakingAbi, environment.stakingAddress);
    return await staking.methods.userInfo(who_).call();
  }

  async getWithdrawRequestBackwards(who, offset, limit) {
    const staking = new this.web3.eth.Contract(environment.stakingAbi, environment.stakingAddress);
    return await staking.methods.getWithdrawRequestBackwards(who, offset, limit).call();
  }

  async getNow() {
    const staking = new this.web3.eth.Contract(environment.stakingAbi, environment.stakingAddress);
    return await staking.methods.getNow().call();
  }

  async requestPayoutStart(assetIndex: number) {
    const committee = new (this._getWeb3().eth.Contract)(environment.committeeAbi, environment.committeeAddress);
    const res = committee.methods.requestPayoutStart(assetIndex).send({from: this.address});
    return await this._send(res, {});
  }

  async buyerAssetIndexPlusOne(who) {
    const buyer = new this.web3.eth.Contract(environment.buyerAbi, environment.buyerAddress);
    return +(await buyer.methods.buyerAssetIndexPlusOne(who).call());
  }

  async moreBonusUserInfo(pid_, who_) {
    const moreBonusHelper = new this.web3.eth.Contract(environment.moreBonusHelperAbi, environment.moreBonusHelperAddress);
    return await moreBonusHelper.methods.userInfo(pid_, who_).call();
  }

  async approve(tokenAddress, spender, accountAddress=this.address) {
    return this._willUseBiconomy() ?
        await this.approveTokenWithBiconomy(tokenAddress, spender, accountAddress) :
        await this.approveWithoutBiconomy(tokenAddress, spender, accountAddress);
  }

  async approveWithoutBiconomy(tokenAddress, spender, accountAddress=this.address) {
    const token = new (this.web3m.eth.Contract)(environment.erc20Abi, tokenAddress);
    let amount;
    if (tokenAddress.toLowerCase() == '0x34c1b299a74588d6abdc1b85a53345a48428a521') {
      // HACK: For EZ, which is 96 bits.
      amount = '0xffffffffffffffffffffffff';
    } else {
      amount = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    }

    const res = token.methods.approve(spender, amount).send({from: accountAddress});
    return await this._send(res, transactionsDescriptions.approveTransaction);
  }

  async approveTokenWithBiconomy(tokenAddress, spenderAddress, accountAddress=this.address) {
    const sendTransaction = (
      accountAddress,
      functionData,
      r,
      s,
      v,
      contract
    ) => {
      return contract.methods
          .executeMetaTransaction(accountAddress, functionData, r, s, v)
          .send({ from: accountAddress, gasLimit: 1000000 }, (error, tHash) => {
            if (error) {
              console.log(
                  `Error while sending executeMetaTransaction tx: ${error}`
              );
              return false;
            }
          });
    };

    const getSignatureParameters = (signature, web3b) => {
      const r = signature.slice(0, 66);
      const s = "0x".concat(signature.slice(66, 130));
      let v = "0x".concat(signature.slice(130, 132));
      let v2 = web3b.utils.hexToNumber(v);
      if (![27, 28].includes(v2)) v2 += 27;
      return {
        r: r,
        s: s,
        v: v2,
      };
    };

    const domainType = [
      {
        name: "name",
        type: "string",
      },
      {
        name: "version",
        type: "string",
      },
      {
        name: "verifyingContract",
        type: "address",
      },
      {
        name: "salt",
        type: "bytes32",
      },
    ];

    const metaTransactionType = [
      { name: "nonce", type: "uint256" },
      { name: "from", type: "address" },
      { name: "functionSignature", type: "bytes" },
    ];

    const tokenName = (environment.networkName != "matic-mumbai") ?
        (tokenAddress == environment.usdcAddress ? "USD Coin (PoS)" : "Tidal Token") :
        (tokenAddress == environment.usdcAddress ? "MockUSDC" : "Tidal Token");

    const domainData = {
      name: tokenName,
      version: "1",
      verifyingContract: tokenAddress,
      salt: "0x" + (environment.chainId).toString(16).padStart(64, "0"),
    };

    const contract = new (this.web3b.eth.Contract)(
        tokenAddress == environment.usdcAddress ? environment.usdcAbi : environment.tidalAbi,
        tokenAddress
    );

    let nonce =(environment.networkName != "matic-mumbai" && tokenAddress == environment.usdcAddress) ?
        (await contract.methods.nonces(accountAddress).call()):
        (await contract.methods.getNonce(accountAddress).call());

    const functionSignature = await contract.methods
      .approve(spenderAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
      .encodeABI();

    const message = {
      nonce: parseInt(nonce),
      from: accountAddress,
      functionSignature: functionSignature
    }

    const dataToSign = JSON.stringify({
      types: {
        EIP712Domain: domainType,
        MetaTransaction: metaTransactionType,
      },
      domain: domainData,
      primaryType: "MetaTransaction",
      message: message,
    });

    const sendAndWait = () => {
      return new Promise(async (resolve, reject) => {
        await this.web3b.currentProvider.send(
          {
            jsonrpc: "2.0",
            id: 999999999999,
            method: "eth_signTypedData_v3",
            params: [accountAddress, dataToSign],
          },
          async (error, response) => {
            console.info(`User signature is ${response.result}`);
            if (error || (response && response.error)) {
              reject("Error while signing the signature");
            } else if (response && response.result) {
              const { r, s, v } = getSignatureParameters(response.result, this.web3b);
              const res = sendTransaction(
                accountAddress,
                functionSignature,
                r,
                s,
                v,
                contract
              );

              resolve(await this._send(res, transactionsDescriptions.approveTransaction));
            }
          }
        );
      });
    };

    return await sendAndWait();
  }

  async init() {
    const isUnlocked = await this.isUnlocked();
    if (isUnlocked) {
      await this.enable();
    }
    this.chainChanged();
  }

  async isUnlocked() {
    return window['ethereum'] && await window['ethereum']['_metamask'].isUnlocked();
  }

  async chainChanged() {
    window['ethereum'].on('chainChanged', () => {
      window.location.reload();
    });
  }
}
