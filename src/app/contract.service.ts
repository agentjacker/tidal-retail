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

  constructor(private transactionsService: TransactionsService, private notifications: NotificationsService) {
  }

  getFixedStr(value: number, precision: number) {
    return (Math.max(0, value - 0.1 ** precision / 2)).toFixed(precision).toString();
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

  _getWeb3(): any {
    return this.web3m;
  }

  async waitForConnection() {
    while(1) {
      if (this.address) {
        break;
      } else {
        await this._wait(500);
      }
    }
  }

  async enable() {
    let res;
    try {
      res = await window['ethereum'].send('eth_requestAccounts');
    } catch(e) {
      return "";
    }

    const provider = environment.web3EndPoint ?
        new window['Web3'].providers.HttpProvider(environment.web3EndPoint) :
            window['ethereum'];
    this.web3 = new window['Web3'](provider);
    this.web3m = new window['Web3'](window['ethereum']);
    this.address = res && res.result ? res.result[0] : "";
    return this.address;
  }

  async balanceOf(tokenAddress, address, decimal, precision=2) {
    const token = new this.web3.eth.Contract(environment.erc20Abi, tokenAddress);
    const value = await token.methods.balanceOf(address).call();
    return this.getFixedStr((+value) / (10 ** decimal), precision);
  }

  async getAllowance(tokenAddress, address, spender, decimal, precision=2) {
    const token = new this.web3.eth.Contract(environment.erc20Abi, tokenAddress);
    const value = await token.methods.allowance(address, spender).call();
    return this.getFixedStr((+value) / (10 ** decimal), precision);
  }

  async loadUSDCBalance(address) {
    this.usdcBalance = await this.balanceOf(environment.usdcAddress, address, environment.usdcDecimals);
    return this.usdcBalance;
  }

  async getUserInfo(address) {
    const retailHelper = new this.web3.eth.Contract(
        environment.retailHelperAbi, environment.retailHelperAddress);
    return await retailHelper.methods.userInfoMap(environment.assetIndex, address).call();
  }

  async getAssetInfo() {
    const retailHelper = new this.web3.eth.Contract(
        environment.retailHelperAbi, environment.retailHelperAddress);
    return await retailHelper.methods.assetInfoMap(environment.assetIndex).call();
  }

  async getSubscriptionByUser(address) {
    const retailHelper = new this.web3.eth.Contract(
        environment.retailHelperAbi, environment.retailHelperAddress);
    return await retailHelper.methods.subscriptionByUser(environment.assetIndex, address).call();
  }

  async getPremiumRate(address) {
    const retailHelper = new this.web3.eth.Contract(
        environment.retailHelperAbi, environment.retailHelperAddress);
    return await retailHelper.methods.getPremiumRate(environment.assetIndex, address).call();
  }

  async getEffectiveCapacity() {
    const retailHelper = new this.web3.eth.Contract(
        environment.retailHelperAbi, environment.retailHelperAddress);
    return await retailHelper.methods.getEffectiveCapacity(environment.assetIndex).call();
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

  async deposit(amount, isBase=true) {
    const retailHelper = new (this._getWeb3().eth.Contract)(environment.retailHelperAbi, environment.retailHelperAddress);
    if (isBase) {
      const res = retailHelper.methods.depositBase(environment.assetIndex, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
      return await this._send(res, transactionsDescriptions.depositTransaction);
    } else {
      const res = retailHelper.methods.depositAsset(environment.assetIndex, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
      return await this._send(res, transactionsDescriptions.depositTransaction);
    }
  }

  async withdraw(amount, isBase=true) {
    const retailHelper = new (this._getWeb3().eth.Contract)(environment.retailHelperAbi, environment.retailHelperAddress);
    if (isBase) {
      const res = retailHelper.methods.withdrawBase(environment.assetIndex, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
      return await this._send(res, transactionsDescriptions.withdrawTransaction);
    } else {
      const res = retailHelper.methods.withdrawAsset(environment.assetIndex, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
      return await this._send(res, transactionsDescriptions.withdrawTransaction);
    }
  }

  async adjustSubscription(amount, isBase=true) {
    const retailHelper = new (this._getWeb3().eth.Contract)(environment.retailHelperAbi, environment.retailHelperAddress);
    if (isBase) {
      const res = retailHelper.methods.adjustSubscriptionBase(environment.assetIndex, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
      return await this._send(res, transactionsDescriptions.adjustSubscriptionTransaction);
    } else {
      const res = retailHelper.methods.adjustSubscriptionAsset(environment.assetIndex, this._decToHex(amount, environment.usdcDecimals)).send({from: this.address});
      return await this._send(res, transactionsDescriptions.adjustSubscriptionTransaction);
    }
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

  async approve(tokenAddress, spender, accountAddress=this.address) {
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
