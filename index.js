const Discord = require("discord.js");
const config = require("./config.json");

const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5000;
express().listen(PORT, () => console.log(`Listening on ${PORT}`));

const Web3 = require("web3");
const provider = new Web3.providers.WebsocketProvider(config.provider.mainnet);
console.log(config.provider.mainnet);
const web3 = new Web3(provider);
const { BN, constants } = require("@openzeppelin/test-helpers");

const contracts = require("./contracts.json").contracts;
const addresses = require("./environments/environment-mainnet.json").addresses;
const markets = require("./markets/markets-mainnet.json");

const universe = new web3.eth.Contract(
  contracts["reporting/Universe.sol"].Universe.abi,
  addresses.Universe
);

const augur = new web3.eth.Contract(
  contracts["Augur.sol"].Augur.abi,
  addresses.Augur
);
const shareToken = new web3.eth.Contract(
  contracts["reporting/ShareToken.sol"].ShareToken.abi,
  addresses.ShareToken
);
const cash = new web3.eth.Contract(
  contracts["Cash.sol"].Cash.abi,
  addresses.Cash
);
const market = new web3.eth.Contract(
  contracts["reporting/Market.sol"].Market.abi
);
//discord setup
const client = new Discord.Client();
const channelId = "762171026619498549"; //augur-foundry

const embed = new Discord.MessageEmbed().setColor("#0099ff");

// console.log(shareToken);

client.on("ready", () => {
  const channel = client.channels.cache.get(channelId);
  //   const channel = client.users.cache.get("548299579964260352");

  let title = "**Foundry TVL Alert**\n";

  console.log(markets[1].address);
  augur.events
    .MarketOIChanged({
      fromBlock: "latest",
      filter: { universe: addresses.universe, market: markets[1].address },
    })
    .on("connected", function (subscriptionId) {
      console.log("connected");
      //   console.log(subscriptionId);
    })
    .on("data", function (event) {
      console.log(event); // same results as the optional callback above
      web3.eth.getTransactionReceipt(event.transactionHash, function (
        erorr,
        result
      ) {
        //lest get how much dai was transaffered

        let sharesMintedWei = web3.eth.abi.decodeParameter(
          "uint256",
          result.logs[0].data
        );
        let sharesMinted = web3.utils.fromWei(sharesMintedWei);
        //if == 0 then it means that somebody sold complete sets
        if (sharesMinted != 0) {
          universe.methods
            .getOpenInterestInAttoCash()
            .call(function (error, totalOIWei) {
              totalOIWei = new BN(totalOIWei);
              console.log(web3.utils.fromWei(totalOIWei).toString());
              let foundryTVLWei = new BN(0);
              //   for (let i = 0; i < markets.length; i++) {
              market.options.address = markets[1].address;
              // foundryTVLWei = foundryTVLWei.add(new BN(await));
              market.methods
                .getOpenInterest()
                .call(function (error, marketTVLWei) {
                  foundryTVLWei = foundryTVLWei.add(new BN(marketTVLWei));
                  let foundryTVLEth = web3.utils.fromWei(foundryTVLWei);
                  //This is a hack for precision when dealing with bignumber
                  let n = foundryTVLEth.indexOf(".");
                  let foundryTVL = foundryTVLEth.substring(
                    0,
                    n != -1 ? n - 3 : foundryTVLEth.length
                  );
                  let foundryPecentageWei = foundryTVLWei
                    .mul(new BN(10).pow(new BN(20)))
                    .div(totalOIWei);
                  let foundryPecentageEth = web3.utils.fromWei(
                    foundryPecentageWei
                  );
                  //This is a hack for precision when dealing with bignumber
                  n = foundryPecentageEth.indexOf(".");
                  let foundryPecentage = foundryPecentageEth.substring(
                    0,
                    n != -1 ? n + 3 : foundryPecentageEth.length
                  );
                  console.log("foundryTVL" + foundryTVL);
                  console.log("foundryPecentage" + foundryPecentage);
                  //   channel.send(
                  //     "who minted:" +
                  //       event.returnValues.to +
                  //       "how many minted:" +
                  //       event.returnValues.values[0]
                  //   );
                  let message = "";
                  message +=
                    "\t" + sharesMinted + " new shares minted :fire: \n";
                  message +=
                    "\tCurrent TVL: " + foundryTVL + "k   :moneybag:\n";
                  message +=
                    "\tPercent of total Augur TVL: " +
                    foundryPecentage +
                    "%  :chart_with_upwards_trend:\n";
                  let etherscanLink =
                    "https://etherscan.io/tx/" + event.transactionHash + "\n";
                  // channel.send(message);
                  embed.setTitle(title);
                  embed.setDescription(message);
                  channel.send(embed);
                  channel.send({
                    embed: {
                      title: "see on etherscan",
                      url: etherscanLink,
                      color: "#0099ff",
                      //   description: "click to see the transaction on etherscan",
                    },
                  });
                  //   process.exit();
                });
            });
        }
        // let totalOIEth = web3.utils.fromWei(totalOIWei);
        // //This is a hack for precision when dealing with bignumber
        // let n = totalOIEth.indexOf(".");
        // let totalOI = totalOIEth.substring(0, n != -1 ? n + 3 : totalOIEth.length);
      });
    })
    .on("error", console.error);
  console.log("Waiting for events...");
});
client.login(config.BOT_TOKEN);
// augur.getPastEvents(
//   "CompleteSetsPurchased",
//   {
//     fromBlock: 0,
//     toBlock: "latest",
//   },
//   function (err, events) {
//     events.forEach((event) => {
//       console.log(event);
//     });
//   }
// );
// console.log(markets[0].address);
// augur.getPastEvents(
//   "CompleteSetsPurchased",

//   {
//     fromBlock: 0,
//     toBlock: "latest",
//     // filter: { universe: addresses.universe, market: markets[0].address },
//   },
//   function (err, events) {
//     events.forEach((event) => {
//       console.log(event);
//
//     });
//   }
// // );
// augur.getPastEvents(
//   "MarketOIChanged",
//   {
//     fromBlock: 0,
//     toBlock: "latest",
//     filter: { universe: addresses.universe, market: markets[1].address },
//   },
//   function (err, events) {
//     events.forEach((event) => {
//       //   console.log(event);
//       web3.eth.getTransactionReceipt(event.transactionHash, function (
//         erorr,
//         result
//       ) {
//         // console.log(result);
//         // lest get how much dai was transaffered
//         // result.logs.forEach((log, i) => {
//         //   //   console.log(log);
//         //   if (
//         //     log.topics[0] ==
//         //     "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
//         //   );
//         //   console.log(true);
//         // });
//         let valueTransffered
//         console.log(
//           "value transferred: " +
//             web3.eth.abi.decodeParameter("uint256", result.logs[0].data)
//         );

//         console.log(result.transactionHash);
//       });
//     });
//   }
// );
