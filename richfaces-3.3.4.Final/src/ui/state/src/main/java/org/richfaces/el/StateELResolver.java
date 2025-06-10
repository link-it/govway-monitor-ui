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
package org.richfaces.el;

import java.beans.FeatureDescriptor;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

import jakarta.el.ELContext;
import jakarta.el.ELResolver;
import jakarta.el.FunctionMapper;
import jakarta.el.PropertyNotFoundException;
import jakarta.el.PropertyNotWritableException;
import jakarta.el.ValueExpression;
import jakarta.el.VariableMapper;
import javax.faces.context.FacesContext;

import org.richfaces.ui.model.State;

/**
 * @author asmirnov
 *
 */
public class StateELResolver extends ELResolver {
	
	private static final class ELContextWrapper extends ELContext {
		private final ELContext context;
		
		private boolean resolved = false;

		private ELContextWrapper(ELContext context) {
			this.context = context;
		}

		@Override
		public ELResolver getELResolver() {
			return context.getELResolver();
		}

		@Override
		public FunctionMapper getFunctionMapper() {
			return context.getFunctionMapper();
		}

		@Override
		public VariableMapper getVariableMapper() {
			return context.getVariableMapper();
		}

		/**
		 * @param key
		 * @return
		 * @see jakarta.el.ELContext#getContext(java.lang.Class)
		 */
		public Object getContext(Class key) {
			return context.getContext(key);
		}

		/**
		 * @return
		 * @see jakarta.el.ELContext#getLocale()
		 */
		public Locale getLocale() {
			return context.getLocale();
		}

		/**
		 * @return
		 * @see jakarta.el.ELContext#isPropertyResolved()
		 */
		public boolean isPropertyResolved() {
			return resolved;
		}

		/**
		 * @param key
		 * @param contextObject
		 * @see jakarta.el.ELContext#putContext(java.lang.Class, java.lang.Object)
		 */
		public void putContext(Class key, Object contextObject) {
			context.putContext(key, contextObject);
		}

		/**
		 * @param locale
		 * @see jakarta.el.ELContext#setLocale(java.util.Locale)
		 */
		public void setLocale(Locale locale) {
			context.setLocale(locale);
		}

		/**
		 * @param resolved
		 * @see jakarta.el.ELContext#setPropertyResolved(boolean)
		 */
		public void setPropertyResolved(boolean resolved) {
			this.resolved = resolved;
		}
	}

	private static List<FeatureDescriptor> stateFeatureDescriptors;
	static {
		FeatureDescriptor descriptor = new FeatureDescriptor();
		descriptor.setDisplayName("Page state");
		descriptor.setExpert(false);
		descriptor.setName("state");
		descriptor.setHidden(false);
		stateFeatureDescriptors = Collections.singletonList(descriptor);
	}

	/* (non-Javadoc)
	 * @see jakarta.el.ELResolver#getCommonPropertyType(jakarta.el.ELContext, java.lang.Object)
	 */
	@Override
	public Class<?> getCommonPropertyType(ELContext context, Object base) {
		if (null != base && base instanceof State) {
			return String.class;			
		}
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.el.ELResolver#getFeatureDescriptors(jakarta.el.ELContext, java.lang.Object)
	 */
	@Override
	public Iterator<FeatureDescriptor> getFeatureDescriptors(ELContext context,
			Object base) {
		if (null != base && base instanceof State) {
			return stateFeatureDescriptors.iterator();			
		}
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.el.ELResolver#getType(jakarta.el.ELContext, java.lang.Object, java.lang.Object)
	 */
	@Override
	public Class<?> getType(ELContext context, Object base, Object property) {
		if (null != base && base instanceof State) {
		      if (property == null) {
		          throw new PropertyNotFoundException("Null property");
		       }
			  State state = (State)base;
			  Object stateProperty = state.get(property.toString());
		      if (stateProperty == null) {
		          throw new PropertyNotFoundException("State Property ["+property+"] not found ");
		      }
		      context.setPropertyResolved(true);
		      if (stateProperty instanceof ValueExpression) {
				ValueExpression propertyExpression = (ValueExpression) stateProperty;
				FacesContext facesContext = FacesContext.getCurrentInstance();
				return propertyExpression.getType(facesContext.getELContext());
			}
			return stateProperty.getClass();
		}
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.el.ELResolver#getValue(jakarta.el.ELContext, java.lang.Object, java.lang.Object)
	 */
	@Override
	public Object getValue(final ELContext context, Object base, Object property) {
		if (null != base && base instanceof State) {
		      if (property == null) {
		          throw new PropertyNotFoundException("Null property");
		       }
			  State state = (State)base;
			  Object stateProperty = state.get(property.toString());
		      if (stateProperty == null) {
		          throw new PropertyNotFoundException("State Property ["+property+"] not found ");
		      }
		      context.setPropertyResolved(true);
		      if (stateProperty instanceof ValueExpression) {
				ValueExpression propertyExpression = (ValueExpression) stateProperty;
				FacesContext facesContext = FacesContext.getCurrentInstance();
				ELContext tempContext = new ELContextWrapper(context);
				return propertyExpression.getValue(tempContext);
			}
			return stateProperty;
		}
		return null;
	}

	/* (non-Javadoc)
	 * @see jakarta.el.ELResolver#isReadOnly(jakarta.el.ELContext, java.lang.Object, java.lang.Object)
	 */
	@Override
	public boolean isReadOnly(ELContext context, Object base, Object property) {
		if (null != base && base instanceof State){
		      if (property == null) {
		          throw new PropertyNotFoundException("Null property");
		       }
			  State state = (State)base;
			  Object stateProperty = state.get(property.toString());
		      if (stateProperty == null) {
		          throw new PropertyNotFoundException("State Property ["+property+"] not found ");
		      }
		      context.setPropertyResolved(true);
		      return true;
		}
		return false;
	}

	/* (non-Javadoc)
	 * @see jakarta.el.ELResolver#setValue(jakarta.el.ELContext, java.lang.Object, java.lang.Object, java.lang.Object)
	 */
	@Override
	public void setValue(ELContext context, Object base, Object property,
			Object value) {
		if (null != base && base instanceof State){
		      if (property == null) {
		          throw new PropertyNotFoundException("Null property");
		       }
		      throw new PropertyNotWritableException((String) property);
		}
	}

}
