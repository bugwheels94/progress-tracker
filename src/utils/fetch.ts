import { stringify } from "@lytejs/query-string";
import { ErrorWithStatus } from "./error";

type temp = Omit<RequestInit, "body"> & {
	body?: any;
	params?: any;
};
export const quickFetch = async <T>(
	url: string,
	{
		headers = {},
		method = "get",
		redirect = "follow",
		body = {},
		params = {},
		credentials = "include",
	}: temp = {}
): Promise<T> => {
	const processedOptions: any = {
		headers,
		method,
		redirect,
		credentials,
	};
	if (Object.keys(body).length) {
		processedOptions.method = method === "get" ? "post" : method;

		processedOptions.body = JSON.stringify(body);
		processedOptions.headers["Content-Type"] =
			processedOptions.headers["Content-Type"] || "application/json";
	}

	const q = stringify(params);
	const res = await fetch(`${url}${q ? `/?${q}` : ""}`, processedOptions);
	let records: string | null = null;
	try {
		records = await res.text();
		records = records.length ? JSON.parse(records) : "";
	} catch (e) {}
	if (res.ok) {
		return records as unknown as T;
	} else {
		// @ts-ignore
		throw new ErrorWithStatus(records, res.status);
	}
	// later use Error Object with stack when time
	// const error: any = {
	//   code: res?.status.toString()
	// }

	// // res.code = res?.status.toString();
	// try {
	//   error.message = await res.text();
	// } catch (e) {
	//   error.message = 'Some Error';
	// }
	// throw error;
};
