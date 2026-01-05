package com.sun.faces.el;

/*
 * Copyright 2002-2017 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * Modificato da Link.it (https://link.it) per applicazione patch di sicurezza e migrazione a jakarta EE
 * 
 * Copyright (c) 2022-2026 Link.it srl (https://link.it). 
 */

import java.beans.FeatureDescriptor;
import java.util.Iterator;

import javax.faces.context.FacesContext;

import jakarta.el.ELContext;
import jakarta.el.ELException;
import jakarta.el.ELResolver;
import jakarta.el.PropertyNotWritableException;

import org.springframework.lang.Nullable;
import org.springframework.util.Assert;
import org.springframework.web.context.WebApplicationContext;

/**
 * JSF {@code ELResolver} that delegates to the Spring root {@code WebApplicationContext},
 * resolving name references to Spring-defined beans.
 *
 * <p>Configure this resolver in your {@code faces-config.xml} file as follows:
 *
 * <pre class="code">
 * &lt;application&gt;
 *   ...
 *   &lt;el-resolver&gt;org.springframework.web.jsf.el.SpringBeanFacesELResolver&lt;/el-resolver&gt;
 * &lt;/application&gt;</pre>
 *
 * All your JSF expressions can then implicitly refer to the names of
 * Spring-managed service layer beans, for example in property values of
 * JSF-managed beans:
 *
 * <pre class="code">
 * &lt;managed-bean&gt;
 *   &lt;managed-bean-name&gt;myJsfManagedBean&lt;/managed-bean-name&gt;
 *   &lt;managed-bean-class&gt;example.MyJsfManagedBean&lt;/managed-bean-class&gt;
 *   &lt;managed-bean-scope&gt;session&lt;/managed-bean-scope&gt;
 *   &lt;managed-property&gt;
 *     &lt;property-name&gt;mySpringManagedBusinessObject&lt;/property-name&gt;
 *     &lt;value&gt;#{mySpringManagedBusinessObject}&lt;/value&gt;
 *   &lt;/managed-property&gt;
 * &lt;/managed-bean&gt;</pre>
 *
 * with "mySpringManagedBusinessObject" defined as Spring bean in
 * applicationContext.xml:
 *
 * <pre class="code">
 * &lt;bean id="mySpringManagedBusinessObject" class="example.MySpringManagedBusinessObject"&gt;
 *   ...
 * &lt;/bean&gt;</pre>
 *
 * @author Juergen Hoeller
 * @since 2.5
 * @see WebApplicationContextFacesELResolver
 */
public class SpringBeanFacesELResolver extends ELResolver {

	@Override
	@Nullable
	public Object getValue(ELContext elContext, @Nullable Object base, Object property) throws ELException {
		if (base == null) {
			String beanName = property.toString();
			WebApplicationContext wac = getWebApplicationContext(elContext);
			if (wac.containsBean(beanName)) {
				elContext.setPropertyResolved(true);
				return wac.getBean(beanName);
			}
		}
		return null;
	}

	@Override
	@Nullable
	public Class<?> getType(ELContext elContext, @Nullable Object base, Object property) throws ELException {
		if (base == null) {
			String beanName = property.toString();
			WebApplicationContext wac = getWebApplicationContext(elContext);
			if (wac.containsBean(beanName)) {
				elContext.setPropertyResolved(true);
				return wac.getType(beanName);
			}
		}
		return null;
	}

	@Override
	public void setValue(ELContext elContext, @Nullable Object base, Object property, Object value) throws ELException {
		if (base == null) {
			String beanName = property.toString();
			WebApplicationContext wac = getWebApplicationContext(elContext);
			if (wac.containsBean(beanName)) {
				if (value == wac.getBean(beanName)) {
					// Setting the bean reference to the same value is alright - can simply be ignored...
					elContext.setPropertyResolved(true);
				}
				else {
					throw new PropertyNotWritableException(
							"Variable '" + beanName + "' refers to a Spring bean which by definition is not writable");
				}
			}
		}
	}

	@Override
	public boolean isReadOnly(ELContext elContext, @Nullable Object base, Object property) throws ELException {
		if (base == null) {
			String beanName = property.toString();
			WebApplicationContext wac = getWebApplicationContext(elContext);
			if (wac.containsBean(beanName)) {
				return true;
			}
		}
		return false;
	}

	@Override
	@Nullable
	public Iterator<FeatureDescriptor> getFeatureDescriptors(ELContext elContext, @Nullable Object base) {
		return null;
	}

	@Override
	public Class<?> getCommonPropertyType(ELContext elContext, @Nullable Object base) {
		return Object.class;
	}

	/**
	 * Retrieve the web application context to delegate bean name resolution to.
	 * <p>The default implementation delegates to FacesContextUtils.
	 * @param elContext the current JSF ELContext
	 * @return the Spring web application context (never {@code null})
	 */
	protected WebApplicationContext getWebApplicationContext(ELContext elContext) {
		FacesContext facesContext = FacesContext.getCurrentInstance();
//		return FacesContextUtils.getRequiredWebApplicationContext(facesContext);
		Assert.notNull(facesContext, "FacesContext must not be null");
		Object attr = facesContext.getExternalContext().getApplicationMap().get(
				WebApplicationContext.ROOT_WEB_APPLICATION_CONTEXT_ATTRIBUTE);
		if (attr == null) {
			return null;
		}
		if (attr instanceof RuntimeException) {
			throw (RuntimeException) attr;
		}
		if (attr instanceof Error)  {
			throw (Error) attr;
		}
		if (!(attr instanceof WebApplicationContext)) {
			throw new IllegalStateException("Root context attribute is not of type WebApplicationContext: " + attr);
		}
		return (WebApplicationContext) attr;
	}

}
