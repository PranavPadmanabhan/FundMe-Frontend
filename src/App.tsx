import { ethers } from "ethers";
import { useEffect, useState } from "react";
import "./App.css";
import { abi, contractAddress } from "./constants/constants";

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("");
  const [balance, setbalance] = useState<string>("0");
  const [ether, setEther] = useState<string>("");

  useEffect(() => {
    if (window.ethereum) {
      checKIsWalletConnected();
      window.ethereum.on("accountsChanged", (accounts: any) => {
        setAddress(accounts[0]);
      });
      getBalance();
    }
    return () => {
      setEther("");
    };
  }, [address]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      await window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((accounts: any) => setAddress(accounts[0]));
    } else {
      alert("Metamask is required");
    }
  };

  const checKIsWalletConnected = async () => {
    const provider = await getProvider();
    const signer = await getSigner();
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const owner = await contract.owner();
    const address = await signer.getAddress();
    if (address && address === owner) {
      setAddress(address);
      setIsOwner(true);
      setIsWalletConnected(true);
    } else {
      setAddress("");
      setIsOwner(false);
      setIsWalletConnected(false);
    }
  };

  const getSigner = async () => {
    return new ethers.providers.Web3Provider(window.ethereum).getSigner();
  };
  const getProvider = async () => {
    return new ethers.providers.Web3Provider(window.ethereum);
  };

  const getBalance = async () => {
    const provider = await getProvider();
    const bal = await provider.getBalance(contractAddress);
    setbalance(ethers.utils.formatEther(bal));
  };

  const fund = async (value: string) => {
    if (window.ethereum) {
      try {
        const provider = await getProvider();

        const signer = await getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        // console.log(contract);
        const transaction = await contract.fund({
          value: ethers.utils.parseEther(value),
        });
        await listenTransactions(transaction, provider);
        setEther("");
      } catch (error) {
        console.log(error);
      }
    }
  };

  const listenTransactions = async (transaction: any, provider: any) => {
    console.log("initializing transaction...");
    return new Promise((resolve, reject) => {
      provider.once(transaction.hash, (reciept: any) => {
        console.log(`Completed with ${reciept.confirmations} confirmations`);
        getBalance();
      });
      resolve("completed");
    });
  };

  const withdraw = async () => {
    try {
      const signer = await getSigner();
      const provider = await getProvider();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const transaction = await contract.withdraw();
      await listenTransactions(transaction, provider);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="relative w-full h-[100vh] bg-slate-700 flex flex-col items-center justify-center">
      <button
        onClick={connectWallet}
        className="absolute top-5 right-5 bg-white px-8 py-2 rounded-md "
      >
        {isWalletConnected ? "Connected" : "ConnectWallet"}
      </button>
      <h1 className="absolute top-[9%] right-5 text-white">
        FundMe balance : {balance}
      </h1>

      <div className=" w-[85%] h-[80%] bg-gray-400 mt-9 rounded-lg flex flex-col items-center justify-start pt-5  box-border">
        <h1 className="text-[2rem] text-white text-opacity-80 font-mono font-semibold tracking-widest my-3">
          FundMe
        </h1>
        {isOwner ? (
          <>
            <button
              onClick={withdraw}
              className="w-[40%] sm:w-[15%] py-2 bg-yellow-50 border-none rounded-md mt-7"
            >
              Withdraw
            </button>

            <span className="text-[1rem] text-black my-3">
              You can Withdraw funds
            </span>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="0.1ETH"
              onChange={(e) => setEther(e.target.value)}
              value={ether}
              className="w-[80%] sm:w-[60%] h-[45px] bg-slate-100 rounded-md pl-4 focus:outline-none placeholder:text-gray-500"
            />
            <button
              onClick={() => fund(ether)}
              className="w-[40%] sm:w-[15%] py-2 bg-yellow-50 border-none rounded-md mt-7"
            >
              Fund
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
