import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const projectId = formData.get("projectId") as string;

    if (!imageFile) {
      return NextResponse.json(
        {
          error: "No image file provided",
        },
        { status: 400 },
      );
    }

    //validate file type
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error: "Invalid file type",
        },
        { status: 400 },
      );
    }

    /////// subscription logic ////
    // const {ok: balanceOk, balance: balanceBalance} = await CreditsBalanceQuery();

    // if(!balanceOk) {
    //     return NextResponse.json({
    //         error: 'Failed to check credits balance'
    //     }, { status: 500 })
    // }

    // if(balanceBalance === 1) {
    //     return NextResponse.json({
    //         error: 'No credits available'
    //     }, { status: 402 })
    // }

    // const { ok } = await ConsumerCreditQuery({amount: 1});

    // if(!ok) {
    //     return NextResponse.json({
    //         error: 'Failed to consume credits'
    //     }, { status: 400 })
    // }

    // //////////////////
  } catch (error) {}
}
