# HackEurope-2026

## THE IDEA -> Prompt Injection Detector

Parse a prompt with basic sanitisation, i.e. removing unusual characters or malicious patterns first\
Then, we pass the sanitized prompt into our A.I. model to detect if the prompt is trying to inject by comparing it to previous prompt injection.\
This is caught before the prompt goes out, and the malicious prompt is shown in our dashboard made on Lovable.

## THE IDEA -> Prompt Injection Pentesting

With this A.I. trained on prompt injection data, we can create new malicious prompts to test our own tools vs current A.I. models.\
We test a suite of malicious prompts against our tools and against current A.I's and see the percentage of prompts that we block vs theirs.\
Our selling point is our testing tools, and our penetrating tools.