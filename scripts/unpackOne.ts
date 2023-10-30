import { Address, internal, toNano } from "@ton/core";
import { Bundle, ScheduledMessage } from "../wrappers/Bundle";
import { NetworkProvider } from "@ton/blueprint";
import { waitForTransaction } from "./ui-utils";

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const senderAddress = provider.sender().address;

    if (!Address.isAddress(senderAddress)) {
        throw new Error("No sender address");
    }

    const bundleAddress = Address.parse(
        args.length > 0 ? args[0] : await ui.input("Bundle address")
    );

    const bundle = provider.open(Bundle.createFromAddress(bundleAddress));

    const itemAddress = Address.parse(
        args.length > 1 ? args[1] : await ui.input("NFT item address")
    );
    const item = provider.open(Bundle.createFromAddress(itemAddress));
    const owner = await item.getOwnerAddress();
    if (!owner.equals(bundleAddress)) {
        ui.write("Bundle is not the owner of this item.");
        return;
    }
    let msgs: ScheduledMessage[] = [
        {
            at: 0,
            message: internal({
                to: itemAddress,
                value: toNano("0.1"),
                body: Bundle.transferMessage(senderAddress, senderAddress),
            }),
        },
    ];
    await bundle.sendMessages(provider.sender(), msgs);

    let changeSucc = await waitForTransaction(provider, itemAddress, 10);

    if (!changeSucc) {
        ui.write(
            "Failed to unpack the item. Can not find the message on its side."
        );
        return;
    } else
        ui.write(
            "Unpack was successfully completed."
        );
}
