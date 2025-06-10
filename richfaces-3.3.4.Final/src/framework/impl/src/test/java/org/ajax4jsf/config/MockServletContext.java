/**
 * License Agreement.
 *
 * Rich Faces - Natural Ajax for Java Server Faces (JSF)
 *
 * Copyright (C) 2007 Exadel, Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License version 2.1 as published by the Free Software Foundation.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2025 Link.it srl (https://link.it). 
 */
package org.ajax4jsf.config;

import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Enumeration;
import java.util.Set;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.Servlet;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRegistration;
import jakarta.servlet.descriptor.JspConfigDescriptor;
import jakarta.servlet.SessionTrackingMode;
import jakarta.servlet.FilterRegistration.Dynamic;
import jakarta.servlet.SessionCookieConfig;
import jakarta.servlet.FilterRegistration;
import jakarta.servlet.Filter;

import java.util.EventListener;
import java.util.Map;

/**
 * @author asmirnov
 *
 */
public class MockServletContext implements ServletContext {

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getAttribute(java.lang.String)
	 */
	public Object getAttribute(String name) {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getAttributeNames()
	 */
	public Enumeration getAttributeNames() {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getContext(java.lang.String)
	 */
	public ServletContext getContext(String uripath) {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getContextPath()
	 */
	public String getContextPath() {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getInitParameter(java.lang.String)
	 */
	public String getInitParameter(String name) {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getInitParameterNames()
	 */
	public Enumeration getInitParameterNames() {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getMajorVersion()
	 */
	public int getMajorVersion() {
		// TODO Auto-generated method stub
		return 0;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getMimeType(java.lang.String)
	 */
	public String getMimeType(String file) {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getMinorVersion()
	 */
	public int getMinorVersion() {
		// TODO Auto-generated method stub
		return 0;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getNamedDispatcher(java.lang.String)
	 */
	public RequestDispatcher getNamedDispatcher(String name) {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getRealPath(java.lang.String)
	 */
	public String getRealPath(String path) {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getRequestDispatcher(java.lang.String)
	 */
	public RequestDispatcher getRequestDispatcher(String path) {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getResource(java.lang.String)
	 */
	public URL getResource(String path) throws MalformedURLException {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getResourceAsStream(java.lang.String)
	 */
	public InputStream getResourceAsStream(String path) {
		return getClass().getResourceAsStream(path);
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getResourcePaths(java.lang.String)
	 */
	public Set getResourcePaths(String path) {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getServerInfo()
	 */
	public String getServerInfo() {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getServlet(java.lang.String)
	 */
	public Servlet getServlet(String name) throws ServletException {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getServletContextName()
	 */
	public String getServletContextName() {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getServletNames()
	 */
	public Enumeration getServletNames() {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#getServlets()
	 */
	public Enumeration getServlets() {
		// TODO Auto-generated method stub
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#log(java.lang.String)
	 */
	public void log(String msg) {
		// TODO Auto-generated method stub

	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#log(java.lang.Exception, java.lang.String)
	 */
	public void log(Exception exception, String msg) {
		// TODO Auto-generated method stub

	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#log(java.lang.String, java.lang.Throwable)
	 */
	public void log(String message, Throwable throwable) {
		// TODO Auto-generated method stub

	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#removeAttribute(java.lang.String)
	 */
	public void removeAttribute(String name) {
		// TODO Auto-generated method stub

	}

	/* (non-Javadoc)
	 * @see jakarta.servlet.ServletContext#setAttribute(java.lang.String, java.lang.Object)
	 */
	public void setAttribute(String name, Object object) {
		// TODO Auto-generated method stub

	}
	
	public void setResponseCharacterEncoding(java.lang.String p) {
		// nop
	}

	public String getResponseCharacterEncoding(){
		return  null;
	}
	
	public void setRequestCharacterEncoding(java.lang.String p) {
		// nop
	}
	
	public String getRequestCharacterEncoding(){
		return  null;
	}
	
	public void setSessionTimeout(int t){
		// nop
	}
	
	public int getSessionTimeout(){
		return -1;
	}
	
	public String getVirtualServerName() {
		return null;
	}
	
	public void declareRoles(java.lang.String... p) {
		// nop
	}
	
	public ClassLoader getClassLoader() {
		return null;
	}
	
	public JspConfigDescriptor getJspConfigDescriptor() {
		return null;
	}

	public <T extends EventListener> T createListener​(Class<T> clazz)
            throws ServletException{
		// nop
		return null;
	}
	
	public <T extends EventListener> void addListener​(T t) {
		// nop
	}
	
	public void addListener​(Class<? extends EventListener> listenerClass) {
		// nop
	}
	
	public void addListener​(String className) {
		// nop
	}
	
	public Set<SessionTrackingMode> getEffectiveSessionTrackingModes(){
		return null;
	}
	
	public Set<SessionTrackingMode> getDefaultSessionTrackingModes(){
		return null;
	}
	
	public void setSessionTrackingModes​(Set<SessionTrackingMode> sessionTrackingModes){
		// nop
	}
	
	public SessionCookieConfig getSessionCookieConfig() {
		return null;
	}
	
	public Map<String,? extends jakarta.servlet.FilterRegistration> getFilterRegistrations(){
		return null;
	}
	
	public FilterRegistration getFilterRegistration​(String filterName) {
		return null;
	}
	
	public <T extends Filter> T createFilter​(Class<T> clazz)
            throws ServletException{
		// nop
		return null;
	}
	
	public Dynamic addFilter(String arg0, String arg1) {
		// TODO Auto-generated method stub
		return null;
	}

	public Dynamic addFilter(String arg0, Filter arg1) {
		// TODO Auto-generated method stub
		return null;
	}

	public Dynamic addFilter(String arg0, Class arg1) {
		// TODO Auto-generated method stub
		return null;
	}

	public jakarta.servlet.ServletRegistration.Dynamic addJspFile(String arg0, String arg1) {
		// TODO Auto-generated method stub
		return null;
	}
	
	public Map getServletRegistrations() {
		// TODO Auto-generated method stub
		return null;
	}
	
	public ServletRegistration getServletRegistration(String arg0) {
		// TODO Auto-generated method stub
		return null;
	}
	
	public Servlet createServlet(Class arg0) throws ServletException {
		// TODO Auto-generated method stub
		return null;
	}
	
	public jakarta.servlet.ServletRegistration.Dynamic addServlet(String arg0, String arg1) {
		// TODO Auto-generated method stub
		return null;
	}

	public jakarta.servlet.ServletRegistration.Dynamic addServlet(String arg0, Servlet arg1) {
		// TODO Auto-generated method stub
		return null;
	}

	public jakarta.servlet.ServletRegistration.Dynamic addServlet(String arg0, Class arg1) {
		// TODO Auto-generated method stub
		return null;
	}
	
	public boolean setInitParameter(String arg0, String arg1) {
		// TODO Auto-generated method stub
		return false;
	}
	
	public int getEffectiveMinorVersion() {
		// TODO Auto-generated method stub
		return 0;
	}
	
	public int getEffectiveMajorVersion() {
		// TODO Auto-generated method stub
		return 0;
	}
}
