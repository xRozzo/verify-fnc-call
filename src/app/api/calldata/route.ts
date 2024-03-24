import { exec } from "child_process";
import util from "util";
import { ethers } from "ethers";
import { NextResponse } from "next/server";

type Body = {
    calldata: string;
    signature: string;
};

export async function POST(request: any) {

    const {signature, calldata}: Body = await request.json();
    console.log(signature);
    console.log(calldata);

    // pass the calldata and execute the cast ....
    // cast -> get the fucntion prams introduced
    const selector = calldata.slice(0, 10); // 8 first plus 0x

    const cmd = `cast --calldata-decode "${signature}" ${calldata}`;
    console.log(cmd);
    
    let stdout, stderr;
    try {
        ({stdout, stderr} = await util.promisify(exec)(cmd));
    } catch (error) {
        console.error(error);
        return NextResponse.json({
            output: error,
        },{status: 400});
    }


    if (stderr) {
        return NextResponse.json({
            output: stderr,
        },{status: 400});
    }

    return NextResponse.json({
        output: stdout,
    },{status: 200});
}
