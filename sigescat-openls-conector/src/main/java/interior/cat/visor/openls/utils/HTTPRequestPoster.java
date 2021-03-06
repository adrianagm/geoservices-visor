package interior.cat.visor.openls.utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.Writer;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.ProtocolException;
import java.net.Proxy;
import java.net.URL;
import java.net.URLConnection;
import java.util.Enumeration;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;


public class HTTPRequestPoster {
	/**
	 * Sends an HTTP GET request to a url
	 * 
	 * @param endpoint
	 *            - The URL of the server. (Example:
	 *            " http://www.yahoo.com/search")
	 * @param requestParameters
	 *            - all the request parameters (Example:
	 *            "param1=val1&param2=val2"). Note: This method will add the
	 *            question mark (?) to the request - DO NOT add it yourself
	 * @return - The response from the end point
	 */
	public static String sendGetRequest(String endpoint,
			String requestParameters) {
		String result = null;
		if (endpoint.startsWith("http://")) {
			// Send a GET request to the servlet
			try {

				// Send data
				String urlStr = endpoint;
				if (requestParameters != null && requestParameters.length() > 0) {
					urlStr += "?" + requestParameters;
				}
				URL url = new URL(urlStr);
				URLConnection conn = url.openConnection();

				// Get the response
				BufferedReader rd = new BufferedReader(new InputStreamReader(
						conn.getInputStream()));
				StringBuffer sb = new StringBuffer();
				String line;
				while ((line = rd.readLine()) != null) {
					sb.append(line);
				}
				rd.close();
				result = sb.toString();
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return result;
	}

	/**
	 * Reads data from the data reader and posts it to a server via POST
	 * request. data - The data you want to send endpoint - The server's address
	 * output - writes the server's response to output
	 * 
	 * @throws Exception
	 */
	public static void postData(HttpServletRequest request, URL endpoint, OutputStream output)
			throws Exception {
		postData(request, endpoint, output, null, 0, null, null);
	}

	/**
	 * Reads data from the data reader and posts it to a server via POST
	 * request. data - The data you want to send endpoint - The server's address
	 * output - writes the server's response to output
	 * 
	 * @throws Exception
	 */
	public static void postData(HttpServletRequest request, URL endpoint, OutputStream output, String proxyUrl, int proxyPort, 
			String proxyUser, String proxyPassword)
					throws Exception {
		HttpURLConnection urlc = null;
		try {
			urlc = (HttpURLConnection) getHttpURLConnection(endpoint, proxyUrl, proxyPort, proxyUser, proxyPassword);
			try {
				urlc.setRequestMethod("POST");
			} catch (ProtocolException e) {
				throw new Exception(
						"Shouldn't happen: HttpURLConnection doesn't support POST??",
						e);
			}
			urlc.setDoOutput(true);
			urlc.setDoInput(true);
			urlc.setUseCaches(false);
			urlc.setAllowUserInteraction(false);
			urlc.setRequestProperty("Content-type", "text/xml; charset="
					+ "UTF-8");
			
			Enumeration headerNames = request.getHeaderNames();
			while(headerNames.hasMoreElements()) {
				String headerName = (String) headerNames.nextElement();
				if(headerName.equalsIgnoreCase("SOAPAction")){
					urlc.setRequestProperty(headerName, request.getHeader(headerName));
				}
			}

			try {             
                IOUtils.copy(request.getInputStream(), urlc.getOutputStream());				
			} catch (IOException e) {
				throw new Exception("IOException while posting data", e);
			} 

			InputStream in = urlc.getInputStream();
			try {				
                IOUtils.copy(urlc.getInputStream(), output);				
			} catch (IOException e) {
				throw new Exception("IOException while reading response", e);
			} finally {
				if (in != null)
					in.close();
			}
			
			if(urlc.getResponseCode() != HttpServletResponse.SC_OK){
				throw new Exception("Response code is not ok, CODE: " + urlc.getResponseCode());
			}

		} catch (IOException e) {
			throw new Exception("Connection error (is server running at "
					+ endpoint + " ?): " + e);
		} finally {
			if (urlc != null)
				urlc.disconnect();
		}
	}
	

	/**
	 * Obtiene la conexion con o sin proxy
	 * 
	 * @param endpoint 
	 * @param proxyUrl url del proxy 
	 * @param proxyPort puerto del proxy
	 * @param proxyUser usuario para el proxy
	 * @param proxyPassword password para el proxy
	 * 
	 * @return conexion con proxy si proxyUrl != null o sin proxy si proxyUrl == null
	 * 
	 * @throws IOException
	 */
	public static HttpURLConnection getHttpURLConnection(URL endpoint, String proxyUrl, int proxyPort, 
			String proxyUser, String proxyPassword) throws IOException {
		HttpURLConnection client;
		if(proxyUrl != null){
			Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyUrl, proxyPort));
	
			System.getProperties().put("http.proxyUser", proxyUser);
			System.getProperties().put("http.proxyPassword", proxyPassword);
			
			client = (HttpURLConnection) endpoint.openConnection(proxy); 
		}else{
			client = (HttpURLConnection) endpoint.openConnection(); 
		}
		return client;
	}
	
	/**
	 * Reads data from the data reader and posts it to a server via POST
	 * request. data - The data you want to send endpoint - The server's address
	 * output - writes the server's response to output
	 * 
	 * @throws Exception
	 */
	public static void postData(Reader data, URL endpoint, OutputStream output)
			throws Exception {
		HttpURLConnection urlc = null;
		try {
			urlc = (HttpURLConnection) endpoint.openConnection();
			try {
				urlc.setRequestMethod("POST");
			} catch (ProtocolException e) {
				throw new Exception(
						"Shouldn't happen: HttpURLConnection doesn't support POST??",
						e);
			}
			urlc.setDoOutput(true);
			urlc.setDoInput(true);
			urlc.setUseCaches(false);
			urlc.setAllowUserInteraction(false);
			urlc.setRequestProperty("Content-type", "text/xml; charset="
					+ "UTF-8");

			OutputStream out = urlc.getOutputStream();

			try {
				IOUtils.copy(data, out,"UTF-8");
			} catch (IOException e) {
				throw new Exception("IOException while posting data", e);
			} finally {
				if (out != null)
					out.close();
			}

			InputStream in = urlc.getInputStream();
			try {
				IOUtils.copy(in, output);
			} catch (IOException e) {
				throw new Exception("IOException while reading response", e);
			} finally {
				if (in != null)
					in.close();
			}

		} catch (IOException e) {
			throw new Exception("Connection error (is server running at "
					+ endpoint + " ?): " + e);
		} finally {
			if (urlc != null)
				urlc.disconnect();
		}
	}
}