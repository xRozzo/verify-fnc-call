"use client";
import Image from "next/image";
import { use, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { error } from "console";

type Body = {
    calldata: string;
    signature: string;
};

const baseUrl = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_APP_URL // Use the environment variable for production
  : 'http://localhost:3000'; // Use localhost for development

const verify_calldata = async (
    calldata: string,
    signature: string
): Promise<string[]> => {
    const data: Body = {
        calldata,
        signature,
    };
    //const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}api/calldata`, {
    const res = await fetch(`${baseUrl}/api/calldata`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // stringify data important
    });

    console.log("res", res);

    if (res.status != 200) {
        throw Error("could not verify calldata...");
    }

    const { output } = await res.json(); // Assuming output is a string with inputs separated by \n

    // Split the output string into an array of strings, separated by newline characters
    const inputs: string[] = output.split("\n");

    // Filter out any empty strings that might result from trailing newlines
    const filteredInputs = inputs.filter((input) => input.trim() !== "");

    return filteredInputs;
};

// https://api.openchain.xyz/signature-database/v1/lookup?function=0xa9059cbb&filter=true -> search for the selector

// body
// {
//     "ok": true,
//     "result": {
//       "event": {},
//       "function": {
//         "0xa9059cbb": [
//           {
//             "name": "transfer(address,uint256)",
//             "filtered": false
//           }
//         ]
//       }
//     }
//   }

export default function Home() {
    const [signature, setSignature] = useState("");
    const [calldata, setCalldata] = useState("");
    const [isSigEqual, setIsSigEqual] = useState(false);
    const [showData, setShow] = useState(true);
    const [inputs, setInputs] = useState<string[]>([]);
    const [isClashing, setIsClashing] = useState(false);
    const [clashingSig, setClashingSig] = useState<string[]>([]);
    const [isError, setIsError] = useState(false);

    const verify = async () => {
        const data: Body = {
            calldata,
            signature,
        };

        //const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}api/signature`, {
        const res = await fetch(`${baseUrl}/api/signature`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data), // stringify data important
        });

        console.log("res from sig verify", res);

        const { selector } = await res.json();

        if (res.status == 200) {
            setIsSigEqual(true);
        } else if (res.status == 201) {
            setIsSigEqual(false);
        } else if (res.status == 400) {
            throw Error("error while verifing signatrue");
        }

        const inputs = await verify_calldata(calldata, signature);
        setInputs(inputs);
        const clashingSig = await fetch(
            `https://api.openchain.xyz/signature-database/v1/lookup?filter=false&function=${selector}`
        );

        const response = await clashingSig.json(); // make sure to use 'await' since .json() returns a promise.

        if (
            response.ok &&
            response.result.function &&
            response.result.function[selector]
        ) {
            // Map through the array of function signatures to get an array of names
            const clashingSignatures = response.result.function[selector].map(
                (sig: any) => sig.name
            );

            // Now clashingSignatures is a string[] of all the names of the results of the query
            console.log(clashingSignatures); // For debugging purposes
            setClashingSig(clashingSignatures);

            // Continue with your logic to use the clashingSignatures array
        } else {
            // Handle the case where there are no clashing signatures or the response is not as expected
            console.log(
                "No clashing signatures found or wrong response structure."
            );
        }
        setShow(true);

        console.log(signature);
        console.log(calldata);
    };

    return (
        <div className="mx-auto max-w-5xl px-4 flex flex-col gap-4 items-center justify-center min-h-[600px]">
            <div className="space-y-2 text-center">
                <h1 className="text-4xl font-bold tracking-tight">
                    Verify Function Call
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Enter the function signature and calldata to verify the
                    function call
                </p>
            </div>
            <div className="w-full rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
                    <div className="flex flex-1 flex-col p-4">
                        <div className="grid gap-1">
                            <Label htmlFor="signature">
                                Function Signature
                            </Label>
                            <Textarea
                                className="min-h-[100px]"
                                id="signature"
                                placeholder="ex: transfer(address,uint256)"
                                onChange={(e) => setSignature(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                        <div className="grid gap-1">
                            <Label htmlFor="calldata">Calldata</Label>
                            <Textarea
                                className="min-h-[100px]"
                                id="calldata"
                                placeholder="Enter the calldata: 0x..."
                                onChange={(e) => setCalldata(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {showData && (
                <div className="w-full mt-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                    <h2 className="text-lg font-semibold">
                        Verification Result
                    </h2>
                    <p
                        className={`text-lg ${
                            isSigEqual ? "text-green-600" : "text-red-600"
                        }`}
                    >
                        {isSigEqual
                            ? "✓ User signature matches with calldata function selector."
                            : "✕ Signatures do not match."}
                    </p>
                    {clashingSig.length > 1 && (
                        <div className="mt-2">
                            <p className="text-lg text-red-600">
                                ✕ There is a selector clash with other
                                functions (same SELECTOR). Clashing signatures:
                            </p>
                            <ul className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                                {clashingSig.map((signature, index) => (
                                    <li
                                        key={index}
                                        className="list-disc list-inside"
                                    >{`${index + 1}. ${signature}`}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <h3 className="mt-4 text-md font-semibold">
                        Decoded Inputs
                    </h3>
                    <div
                        className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4"
                        role="alert"
                    >
                        <ul>
                            {inputs.map((input, index) => (
                                <li
                                    key={index}
                                    className="list-disc list-inside"
                                >{`${index + 1}. ${input}`}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="grid gap-2">
                <Button onClick={verify} className="w-full">
                    Verify
                </Button>
            </div>
        </div>
    );
}
