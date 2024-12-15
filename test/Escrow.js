const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let realEstate, escrow;
  let buyer, seller, inspector, lender;

  beforeEach(async () => {
    // Setup accounts
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Deploy the RealEstate
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    // Mint
    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://bafybeig5yh5qym6fxvbj3m5d3l7bpwavr3csu43ey22tzgqe4woqkjwcmy.ipfs.dweb.link?filename=1.json"
      );
    await transaction.wait();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.address,
      seller.address,
      inspector.address,
      lender.address
    );

    // Approve
    transaction = await realEstate.connect(seller).approve(escrow.address, 1);
    await transaction.wait();

    // List
    transaction = await escrow
      .connect(seller)
      .list(1, buyer.address, tokens(20), tokens(10));
    await transaction.wait();
  });

  describe("Deployment", async () => {
    it("Returns the NFT address", async () => {
      let result = await escrow.nftAddress();
      expect(result).to.be.equal(realEstate.address);
    });

    it("Returns the seller address", async () => {
      const result = await escrow.seller();
      expect(result).to.be.equal(seller.address);
    });

    it("Retusn the inspector address", async () => {
      const result = await escrow.inspector();
      expect(result).to.be.equal(inspector.address);
    });

    it("Returns the lender address", async () => {
      const result = await escrow.lender();
      expect(result).to.be.equal(lender.address);
    });
  });

  describe("Listing", async () => {
    it("Updates as listed", async () => {
      const result = await escrow.isListed(1);
      expect(result).to.be.equal(true);
    });

    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
    });

    it("Returns buyer", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.be.equal(buyer.address);
    });

    it("Return purchase price", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.be.equal(tokens(20));
    });

    it("Return escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.be.equal(tokens(10));
    });
  });
});
