import { exec } from "child_process";
import util from "util";
import { ethers } from "ethers";
import { NextResponse } from "next/server";

type Body = {
    calldata: string;
    signature: string;
};

export async function POST(request: any) {
    const params: Body = await request.json();

    // transform signature to selecotr
    // get 4 first bytes of the calldata
    console.log({params});

    let stdout, stderr;
    const hash_sig = ethers.keccak256(ethers.toUtf8Bytes(params.signature));
    const user_selector = hash_sig.slice(0, 10);;
    console.log(user_selector);
    const calldata_selector = params.calldata.slice(0, 10);

    console.log(calldata_selector);

    if (user_selector === calldata_selector) {
        return NextResponse.json({ selector: user_selector }, { status: 200 });
    } else {
        if (stderr) {
            return NextResponse.json({ output: stderr }, { status: 400 });
        }
        return NextResponse.json({ user_selector: user_selector, calldata_selector: calldata_selector }, { status: 201 });
    }
}
